/**
 * Cancel Tournament API Route
 * Creator or admin can cancel a tournament before it starts
 * All participants are refunded based on their individual entry fees
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionOrForbidden } from "@/lib/auth-actions";
import { calculateEntryFee } from "@/lib/elo";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await getAdminSessionOrForbidden();
    if (response) return response;

    const { id: tournamentId } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          include: {
            user: true,
            team: { include: { player1: true, player2: true } },
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.status !== 'REGISTRATION_OPEN') {
      return NextResponse.json({ error: "Cannot cancel after tournament has started" }, { status: 400 });
    }

    // Refund all participants
    await prisma.$transaction(async (tx) => {
      for (const participant of tournament.participants) {
        if (participant.teamId && participant.team) {
          // Doubles: refund each player their individual fee
          const player1Fee = calculateEntryFee(participant.player1EloAtEntry || participant.team.player1.foreverElo);
          const player2Fee = calculateEntryFee(participant.player2EloAtEntry || participant.team.player2.foreverElo);

          if (player1Fee > 0) {
            await tx.user.update({
              where: { id: participant.team.player1Id },
              data: { foreverElo: participant.team.player1.foreverElo + player1Fee },
            });
            await tx.eloHistory.create({
              data: {
                userId: participant.team.player1Id,
                changeType: 'TOURNAMENT_ENTRY',
                eloBefore: participant.team.player1.foreverElo,
                eloAfter: participant.team.player1.foreverElo + player1Fee,
                change: player1Fee,
                description: `Tournament cancelled: ${tournament.name}`,
                metadata: { tournamentId, teamId: participant.teamId, isRefund: true, isCancellation: true },
              },
            });
          }

          if (player2Fee > 0) {
            await tx.user.update({
              where: { id: participant.team.player2Id },
              data: { foreverElo: participant.team.player2.foreverElo + player2Fee },
            });
            await tx.eloHistory.create({
              data: {
                userId: participant.team.player2Id,
                changeType: 'TOURNAMENT_ENTRY',
                eloBefore: participant.team.player2.foreverElo,
                eloAfter: participant.team.player2.foreverElo + player2Fee,
                change: player2Fee,
                description: `Tournament cancelled: ${tournament.name}`,
                metadata: { tournamentId, teamId: participant.teamId, isRefund: true, isCancellation: true },
              },
            });
          }
        } else if (participant.userId && participant.user) {
          // Singles: refund the player
          const entryFee = calculateEntryFee(participant.eloAtEntry);
          if (entryFee > 0) {
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
                description: `Tournament cancelled: ${tournament.name}`,
                metadata: { tournamentId, isRefund: true, isCancellation: true },
              },
            });
          }
        }
      }

      // Delete tournament (cascade will delete participants and brackets)
      await tx.tournament.delete({ where: { id: tournamentId } });
    });

    return NextResponse.json({ success: true, message: "Tournament cancelled and all players refunded" });
  } catch (error) {
    console.error("Error cancelling tournament:", error);
    return NextResponse.json({ error: "Failed to cancel tournament" }, { status: 500 });
  }
}
