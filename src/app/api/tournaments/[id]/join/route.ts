/**
 * Tournament Join API Route
 * Handles player registration and entry fee payment
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";
import { calculateEntryFee } from "@/lib/elo";

/**
 * POST /api/tournaments/[id]/join - Join a tournament
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;

    const { id: tournamentId } = await params;
    const userId = session!.user.id;

    // Get tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check if tournament is open for registration
    if (tournament.status !== "REGISTRATION_OPEN") {
      return NextResponse.json(
        { error: "Tournament is not open for registration" },
        { status: 400 }
      );
    }

    // Check if tournament is full
    if (tournament._count.participants >= tournament.maxParticipants) {
      return NextResponse.json(
        { error: "Tournament is full" },
        { status: 400 }
      );
    }

    // Check if user is already registered
    const existingParticipant = await prisma.tournamentParticipant.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId,
        },
      },
    });

    if (existingParticipant) {
      return NextResponse.json(
        { error: "You are already registered for this tournament" },
        { status: 400 }
      );
    }

    // Get user to calculate entry fee
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is banned
    if (user.isBanned) {
      return NextResponse.json(
        { error: "Banned users cannot join tournaments" },
        { status: 403 }
      );
    }

    // Calculate entry fee based on current ELO
    const entryFee = calculateEntryFee(user.foreverElo);

    // Check if user has enough ELO for entry fee (if applicable)
    if (user.foreverElo < entryFee) {
      return NextResponse.json(
        { error: `Insufficient ELO to join. You need at least ${entryFee} ELO.` },
        { status: 400 }
      );
    }

    // Create participant and deduct ELO in a transaction
    const participant = await prisma.$transaction(async (tx) => {
      // Deduct entry fee if applicable
      if (entryFee > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            foreverElo: user.foreverElo - entryFee,
          },
        });
      }

      // Create participant record
      return tx.tournamentParticipant.create({
        data: {
          tournamentId,
          userId,
          eloAtEntry: user.foreverElo,
          paidEntry: entryFee === 0 || entryFee > 0, // Mark as paid regardless since ELO is deducted
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              foreverElo: true,
            },
          },
        },
      });
    });

    return NextResponse.json({
      participant,
      entryFee,
      deducted: entryFee > 0,
      message: entryFee > 0
        ? `You paid ${entryFee} ELO to join the tournament`
        : "You joined the tournament for free (ELO below 800)",
    }, { status: 201 });
  } catch (error) {
    console.error("Error joining tournament:", error);
    return NextResponse.json(
      { error: "Failed to join tournament" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tournaments/[id]/join - Leave a tournament
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;

    const { id: tournamentId } = await params;
    const userId = session!.user.id;

    // Get tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check if tournament is still accepting registrations
    if (tournament.status !== "REGISTRATION_OPEN") {
      return NextResponse.json(
        { error: "Cannot leave tournament after it has started" },
        { status: 400 }
      );
    }

    // Get participant
    const participant = await prisma.tournamentParticipant.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "You are not registered for this tournament" },
        { status: 400 }
      );
    }

    // Refund entry fee if it was paid
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    await prisma.$transaction(async (tx) => {
      // Delete participant
      await tx.tournamentParticipant.delete({
        where: { id: participant.id },
      });

      // Refund entry fee if it was paid and not already paid out
      if (participant.paidEntry && !participant.paidOut && participant.eloAtEntry > 0) {
        const entryFee = participant.eloAtEntry - (user?.foreverElo || 0);
        if (entryFee > 0) {
          await tx.user.update({
            where: { id: userId },
            data: {
              foreverElo: user!.foreverElo + entryFee,
            },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "You have left the tournament",
    });
  } catch (error) {
    console.error("Error leaving tournament:", error);
    return NextResponse.json(
      { error: "Failed to leave tournament" },
      { status: 500 }
    );
  }
}
