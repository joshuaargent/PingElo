/**
 * Remove Participant from Tournament API
 * Only creator or admin can remove participants
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";
import { calculateEntryFee, calculateDoublesEntryFee } from "@/lib/elo";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await getSessionOrUnauthorized();
    if (response) return response;

    const { id: tournamentId } = await params;
    const { participantId } = await request.json();

    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      );
    }

    // Get tournament and verify permissions
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    if (tournament.status !== 'REGISTRATION_OPEN') {
      return NextResponse.json(
        { error: "Cannot remove participants after tournament has started" },
        { status: 400 }
      );
    }

    const { session } = await getSessionOrUnauthorized();
    const userId = (session as any)?.user?.id;
    const isAdmin = (session as any)?.user?.role === 'ADMIN';
    const isCreator = tournament.creatorId === userId;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: "Only tournament creator or admin can remove participants" },
        { status: 403 }
      );
    }

    // Get the participant with their user/team info
    const participant = await prisma.tournamentParticipant.findUnique({
      where: { id: participantId },
      include: {
        user: true,
        team: {
          include: {
            player1: true,
            player2: true,
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // Calculate refund amount - use LOCKED-IN entry values, NOT current ELO
    // The entry fee was calculated at entry time based on eloAtEntry
    let entryFee = 0;
    if (participant.teamId && participant.team) {
      // For doubles: use the locked-in entry ELO values
      const p1EloAtEntry = participant.player1EloAtEntry || participant.team.player1.foreverElo;
      const p2EloAtEntry = participant.player2EloAtEntry || participant.team.player2?.foreverElo || participant.team.player1.foreverElo;
      entryFee = calculateDoublesEntryFee(p1EloAtEntry, p2EloAtEntry) * 2;
    } else if (participant.userId && participant.user) {
      entryFee = calculateEntryFee(participant.eloAtEntry);
    }

    // Use transaction to prevent race conditions
    await prisma.$transaction(async (tx) => {
      if (entryFee > 0) {
        // Deduct from prize pool first
        await tx.tournament.update({
          where: { id: tournamentId },
          data: { prizePool: tournament.prizePool - entryFee },
        });

        if (participant.teamId && participant.team) {
          // Refund each player individually based on their locked-in entry fee
          const feePerPlayer = calculateDoublesEntryFee(
            participant.player1EloAtEntry || participant.team.player1.foreverElo,
            participant.player2EloAtEntry || participant.team.player2?.foreverElo || participant.team.player1.foreverElo
          );
          
          // Refund player 1
          await tx.user.update({
            where: { id: participant.team.player1Id },
            data: { foreverElo: { increment: feePerPlayer } },
          });
          await tx.eloHistory.create({
            data: {
              userId: participant.team.player1Id,
              changeType: 'TOURNAMENT_ENTRY',
              eloBefore: participant.team.player1.foreverElo,
              eloAfter: participant.team.player1.foreverElo + feePerPlayer,
              change: feePerPlayer,
              description: `Refund for being removed from tournament: ${tournament.name}`,
              metadata: {
                tournamentId,
                teamId: participant.teamId,
                isRefund: true,
                removedBy: userId,
              },
            },
          });
          
          // Refund player 2 if exists
          if (participant.team.player2Id) {
            await tx.user.update({
              where: { id: participant.team.player2Id },
              data: { foreverElo: { increment: feePerPlayer } },
            });
            await tx.eloHistory.create({
              data: {
                userId: participant.team.player2Id,
                changeType: 'TOURNAMENT_ENTRY',
                eloBefore: participant.team.player2.foreverElo,
                eloAfter: participant.team.player2.foreverElo + feePerPlayer,
                change: feePerPlayer,
                description: `Refund for being removed from tournament: ${tournament.name}`,
                metadata: {
                  tournamentId,
                  teamId: participant.teamId,
                  isRefund: true,
                  removedBy: userId,
                },
              },
            });
          }
        } else if (participant.userId && participant.user) {
          await tx.user.update({
            where: { id: participant.userId },
            data: { foreverElo: { increment: entryFee } },
          });
          await tx.eloHistory.create({
            data: {
              userId: participant.userId,
              changeType: 'TOURNAMENT_ENTRY',
              eloBefore: participant.user.foreverElo,
              eloAfter: participant.user.foreverElo + entryFee,
              change: entryFee,
              description: `Refund for being removed from tournament: ${tournament.name}`,
              metadata: {
                tournamentId,
                isRefund: true,
                removedBy: userId,
              },
            },
          });
        }
      }

      // Remove participant
      await tx.tournamentParticipant.delete({ where: { id: participant.id } });
    });

    return NextResponse.json({ 
      success: true, 
      refundAmount: entryFee,
      message: entryFee > 0 ? `Refunded ${entryFee} ELO` : 'Participant removed'
    });
  } catch (error) {
    console.error("Error removing participant:", error);
    return NextResponse.json(
      { error: "Failed to remove participant" },
      { status: 500 }
    );
  }
}
