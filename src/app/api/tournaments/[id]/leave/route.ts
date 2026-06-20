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
      // For doubles: use the locked-in entry ELO values
      const p1EloAtEntry = participant.player1EloAtEntry || participant.team.player1.foreverElo;
      const p2EloAtEntry = participant.player2EloAtEntry || participant.team.player2?.foreverElo || participant.team.player1.foreverElo;
      // Recalculate the entry fee based on ELOs at time of entry
      entryFee = calculateDoublesEntryFee(p1EloAtEntry, p2EloAtEntry) * 2;
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
        // Refund each player individually based on their entry fee
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
            description: `Refund for leaving tournament: ${tournament.name}`,
            metadata: { tournamentId, teamId: participant.teamId, isRefund: true },
          },
        });
        
        // Refund player 2 if exists
        if (participant.team.player2Id && participant.team.player2) {
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
              description: `Refund for leaving tournament: ${tournament.name}`,
              metadata: { tournamentId, teamId: participant.teamId, isRefund: true },
            },
          });
        }
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
