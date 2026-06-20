/**
 * Cancel Tournament API Route
 * Creator or admin can cancel a tournament before it starts
 * All participants are refunded
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionOrForbidden } from "@/lib/auth-actions";

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
        let entryFee = 0;
        if (participant.teamId && participant.team) {
          entryFee = participant.eloAtEntry - participant.team.foreverElo;
        } else if (participant.userId && participant.user) {
          entryFee = participant.eloAtEntry - participant.user.foreverElo;
        }

        if (entryFee > 0) {
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
                  description: `Tournament cancelled: ${tournament.name}`,
                  metadata: { tournamentId, teamId: participant.teamId, isRefund: true, isCancellation: true },
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
