/**
 * Tournament Detail API Route
 * Handles single tournament retrieval and operations
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized, getAdminSessionOrForbidden } from "@/lib/auth-actions";
import { calculateEntryFee, calculateTournamentPayout, getTournamentPrizePool } from "@/lib/elo";

/**
 * GET /api/tournaments/[id] - Get tournament details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        participants: {
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
          orderBy: {
            createdAt: "asc",
          },
        },
        matches: {
          where: { deletedAt: null },
          include: {
            player1: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            player2: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
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

    return NextResponse.json({ tournament });
  } catch (error) {
    console.error("Error fetching tournament:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tournaments/[id] - Update tournament
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;

    const { id } = await params;
    const body = await request.json();

    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Only creator or admin can update
    const isAdmin = session!.user.role === "ADMIN";
    const isCreator = tournament.creatorId === session!.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: "Only tournament creator or admin can update tournament" },
        { status: 403 }
      );
    }

    // Cannot update completed or cancelled tournaments
    if (tournament.status === "COMPLETED" || tournament.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot update completed or cancelled tournaments" },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.maxScore !== undefined) updateData.maxScore = body.maxScore;
    if (body.format !== undefined) updateData.format = body.format;
    if (body.maxParticipants !== undefined) updateData.maxParticipants = body.maxParticipants;
    if (body.startsAt !== undefined) {
      updateData.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    }
    if (body.status !== undefined) {
      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        DRAFT: ["REGISTRATION_OPEN", "CANCELLED"],
        REGISTRATION_OPEN: ["IN_PROGRESS", "CANCELLED"],
        IN_PROGRESS: ["COMPLETED", "CANCELLED"],
      };

      if (!validTransitions[tournament.status]?.includes(body.status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${tournament.status} to ${body.status}` },
          { status: 400 }
        );
      }

      updateData.status = body.status;
    }

    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    return NextResponse.json({
      tournament: {
        ...updatedTournament,
        participantCount: updatedTournament._count.participants,
        _count: undefined,
      },
    });
  } catch (error) {
    console.error("Error updating tournament:", error);
    return NextResponse.json(
      { error: "Failed to update tournament" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tournaments/[id] - Delete tournament (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response: authResponse } = await getAdminSessionOrForbidden();
    if (authResponse) return authResponse;

    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Cannot delete in-progress tournaments (cancel instead)
    if (tournament.status === "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Cannot delete in-progress tournaments. Cancel it instead." },
        { status: 400 }
      );
    }

    await prisma.tournament.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tournament:", error);
    return NextResponse.json(
      { error: "Failed to delete tournament" },
      { status: 500 }
    );
  }
}
