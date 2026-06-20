/**
 * Remove Participant from Tournament API
 * Only creator or admin can remove participants
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

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

    // Calculate refund amount
    let entryFee = 0;
    if (participant.teamId && participant.team) {
      // For doubles: refund the full team entry fee
      entryFee = participant.eloAtEntry - participant.team.foreverElo;
    } else if (participant.userId && participant.user) {
      // For singles: refund based on difference
      entryFee = participant.eloAtEntry - participant.user.foreverElo;
    }

    // Refund entry fee, create history entries, and deduct from prize pool
    if (entryFee > 0) {
      // Deduct from prize pool first
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { prizePool: tournament.prizePool - entryFee },
      });

      if (participant.teamId && participant.team) {
        await prisma.team.update({
          where: { id: participant.teamId },
          data: { foreverElo: participant.team.foreverElo + entryFee },
        });

        // Split refund between team players
        const feePerPlayer = Math.floor(entryFee / 2);
        for (const player of [participant.team.player1, participant.team.player2].filter(Boolean) as any[]) {
          await prisma.eloHistory.create({
            data: {
              userId: player.id,
              changeType: 'TOURNAMENT_ENTRY',
              eloBefore: player.foreverElo,
              eloAfter: player.foreverElo + feePerPlayer,
              change: feePerPlayer,
              description: `Refund for leaving tournament: ${tournament.name}`,
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
        await prisma.user.update({
          where: { id: participant.userId },
          data: { foreverElo: participant.user.foreverElo + entryFee },
        });

        // Create refund history entry
        await prisma.eloHistory.create({
          data: {
            userId: participant.userId,
            changeType: 'TOURNAMENT_ENTRY',
            eloBefore: participant.user.foreverElo,
            eloAfter: participant.user.foreverElo + entryFee,
            change: entryFee,
            description: `Refund for leaving tournament: ${tournament.name}`,
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
    await prisma.tournamentParticipant.delete({
      where: { id: participantId },
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
