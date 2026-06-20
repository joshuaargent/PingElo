/**
 * Admin Delete Match API Route
 * Allows admins to delete matches and optionally revert ELO changes
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionOrForbidden } from "@/lib/auth-actions";
import { DEFAULT_ELO, calculateEloChange, calculateDoublesEloChange, getTeamElo } from "@/lib/elo";

/**
 * POST /api/admin/delete-match
 * Delete a match and optionally revert ELO changes
 */
export async function POST(request: NextRequest) {
  try {
    const { response: authResponse } = await getAdminSessionOrForbidden();
    if (authResponse) return authResponse;

    const body = await request.json();
    const { matchId, revertElo = true } = body;

    if (!matchId) {
      return NextResponse.json({ error: "matchId is required" }, { status: 400 });
    }

    // Get the match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: { select: { id: true, name: true, foreverElo: true, seasonElo: true } },
        player2: { select: { id: true, name: true, foreverElo: true, seasonElo: true } },
        team1Player1: { select: { id: true, name: true, doublesForeverElo: true } },
        team1Player2: { select: { id: true, name: true, doublesForeverElo: true } },
        team2Player1: { select: { id: true, name: true, doublesForeverElo: true } },
        team2Player2: { select: { id: true, name: true, doublesForeverElo: true } },
        tournament: { select: { id: true, name: true, status: true } },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check if it's a tournament match
    if (match.tournamentId) {
      // Only allow deletion if tournament is not completed
      if (match.tournament?.status === 'COMPLETED') {
        return NextResponse.json({ 
          error: "Cannot delete matches from completed tournaments. Only admin can override." 
        }, { status: 403 });
      }
    }

    // Mark match as deleted (soft delete)
    await prisma.match.update({
      where: { id: matchId },
      data: { deletedAt: new Date() },
    });

    // Revert ELO changes if requested
    if (revertElo && match.matchType === 'SINGLES') {
      // Revert singles ELO changes
      const eloHistory = await prisma.eloHistory.findMany({
        where: { matchId: matchId },
      });

      for (const history of eloHistory) {
        // Calculate the opposite change (if they gained +10, we subtract 10 to revert)
        const revertChange = -history.change;
        
        await prisma.user.update({
          where: { id: history.userId },
          data: {
            foreverElo: history.eloBefore,
            seasonElo: history.eloBefore, // Assuming eloBefore was season ELO at that time
          },
        });

        // Delete the ELO history entry
        await prisma.eloHistory.delete({
          where: { id: history.id },
        });
      }
    } else if (revertElo && match.matchType === 'DOUBLES') {
      // Revert doubles ELO changes
      const eloHistory = await prisma.eloHistory.findMany({
        where: { matchId: matchId },
      });

      for (const history of eloHistory) {
        await prisma.user.update({
          where: { id: history.userId },
          data: {
            doublesForeverElo: history.eloBefore,
            doublesSeasonElo: history.eloBefore,
          },
        });

        // Delete the ELO history entry
        await prisma.eloHistory.delete({
          where: { id: history.id },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Match deleted${revertElo ? ' and ELO reverted' : ''}`,
      matchId,
    });

  } catch (error) {
    console.error("Error deleting match:", error);
    return NextResponse.json({ error: "Failed to delete match" }, { status: 500 });
  }
}
