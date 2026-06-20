/**
 * Leave Tournament API Route
 * Allows a participant to leave a tournament before it starts
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

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

    let entryFee = 0;
    if (participant.teamId && participant.team) {
      entryFee = participant.eloAtEntry - participant.team.foreverElo;
    } else if (participant.userId && participant.user) {
      entryFee = participant.eloAtEntry - participant.user.foreverElo;
    }

    await prisma.$transaction(async (tx) => {
      if (entryFee > 0) {
        await tx.tournament.update({
          where: { id: tournamentId },
          data: { prizePool: tournament.prizePool - entryFee },
        });
      }

      if (participant.teamId && participant.team) {
        await tx.team.update({
          where: { id: participant.teamId },
          data: { foreverElo: participant.team.foreverElo + entryFee },
        });
        const feePerPlayer = Math.floor(entryFee / 2);
        for (const player of [participant.team.player1, participant.team.player2]) {
          await tx.eloHistory.create({
            data: {
              userId: player.id,
              changeType: 'TOURNAMENT_ENTRY',
              eloBefore: player.foreverElo,
              eloAfter: player.foreverElo + feePerPlayer,
              change: feePerPlayer,
              description: `Refund for leaving tournament: ${tournament.name}`,
              metadata: { tournamentId, teamId: participant.teamId, isRefund: true },
            },
          });
        }
      } else if (participant.userId && participant.user) {
        await tx.user.update({
          where: { id: participant.userId },
          data: { foreverElo: participant.user.foreverElo + entryFee },
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
