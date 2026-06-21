/**
 * Cancel Tournament API Route
 * Creator or admin can cancel a tournament before it starts
 * All participants are refunded based on their individual entry fees
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionOrForbidden } from "@/lib/auth-actions";
import { calculateEntryFee, calculateDoublesEntryFee } from "@/lib/elo";

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
          // Doubles: refund team ELO (not individual players)
          const entryFee = calculateEntryFee(participant.eloAtEntry);
          
          if (entryFee > 0) {
            const freshTeam = await tx.team.findUnique({ where: { id: participant.teamId } });
            
            // Refund team ELO
            await tx.team.update({
              where: { id: participant.teamId },
              data: { foreverElo: (freshTeam?.foreverElo || participant.eloAtEntry) + entryFee },
            });
            
            // Record team ELO history
            await tx.teamEloHistory.create({
              data: {
                teamId: participant.teamId,
                changeType: 'TOURNAMENT_ENTRY',
                eloBefore: freshTeam?.foreverElo || participant.eloAtEntry,
                eloAfter: (freshTeam?.foreverElo || participant.eloAtEntry) + entryFee,
                change: entryFee,
                description: `Tournament cancelled: ${tournament.name}`,
                metadata: { tournamentId, isRefund: true, isCancellation: true, isTeamRefund: true },
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
