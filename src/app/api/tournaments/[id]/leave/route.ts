/**
 * Leave Tournament API Route
 * Allows a participant to leave a tournament before it starts
 * Refunds the original entry fee based on locked-in ELO at entry time
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
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;

    const { id: tournamentId } = await params;
    const userId = session!.user.id;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.status !== 'REGISTRATION_OPEN') {
      return NextResponse.json({ error: "Cannot leave after tournament has started" }, { status: 400 });
    }

    const participant = await prisma.tournamentParticipant.findFirst({
      where: {
        tournamentId,
        OR: [
          { userId },
          { team: { OR: [{ player1Id: userId }, { player2Id: userId }] } },
        ],
      },
      include: {
        user: true,
        team: { include: { player1: true, player2: true } },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Not registered for this tournament" }, { status: 400 });
    }

    // Calculate refund amount using LOCKED-IN entry values, NOT current ELO
    // This prevents teams from gaining ELO by leaving after winning matches
    let entryFee = 0;
    if (participant.teamId && participant.team) {
      // For doubles: use the locked-in team ELO at entry
      entryFee = calculateEntryFee(participant.eloAtEntry);
    } else if (participant.userId && participant.user) {
      // For singles: use eloAtEntry to calculate what they paid
      entryFee = calculateEntryFee(participant.eloAtEntry);
    }

    await prisma.$transaction(async (tx) => {
      if (entryFee > 0) {
        // Deduct from prize pool
        await tx.tournament.update({
          where: { id: tournamentId },
          data: { prizePool: tournament.prizePool - entryFee },
        });
      }

      if (participant.teamId && participant.team) {
        // Refund team ELO (not individual player ELO)
        const freshTeam = await tx.team.findUnique({ where: { id: participant.teamId } });
        
        await tx.team.update({
          where: { id: participant.teamId },
          data: { foreverElo: { increment: entryFee } },
        });
        
        await tx.teamEloHistory.create({
          data: {
            teamId: participant.teamId,
            changeType: 'TOURNAMENT_ENTRY',
            eloBefore: freshTeam?.foreverElo || participant.eloAtEntry,
            eloAfter: (freshTeam?.foreverElo || participant.eloAtEntry) + entryFee,
            change: entryFee,
            description: `Refund for leaving tournament: ${tournament.name}`,
            metadata: { tournamentId, isRefund: true, isTeamRefund: true },
          },
        });
      } else if (participant.userId && participant.user) {
        // Refund the individual player
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
            description: `Refund for leaving tournament: ${tournament.name}`,
            metadata: { tournamentId, isRefund: true },
          },
        });
      }

      await tx.tournamentParticipant.delete({ where: { id: participant.id } });
    });

    return NextResponse.json({ success: true, refundAmount: entryFee });
  } catch (error) {
    console.error("Error leaving tournament:", error);
    return NextResponse.json({ error: "Failed to leave tournament" }, { status: 500 });
  }
}
