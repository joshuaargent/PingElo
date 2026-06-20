/**
 * Teams Leaderboard API Route
 * Returns team rankings
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/leaderboard/teams
 * Query params:
 *   - activeOnly: "true" to show only active teams (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("activeOnly") === "true";

    // Get teams with player info
    const teams = await prisma.team.findMany({
      where: activeOnly ? { isActive: true } : {},
      include: {
        player1: { select: { id: true, name: true, image: true } },
        player2: { select: { id: true, name: true, image: true } },
      },
      orderBy: { foreverElo: 'desc' },
    });

    // Format response
    const leaderboard = teams.map((team, index) => ({
      rank: index + 1,
      teamId: team.id,
      name: `${team.player1?.name || 'Unknown'}${team.player2 ? ` & ${team.player2.name}` : ''}`,
      player1: team.player1,
      player2: team.player2,
      elo: team.foreverElo,
      matchesPlayed: team.totalMatchesPlayed,
      wins: team.totalWins,
      losses: team.totalLosses,
      winRate: team.totalMatchesPlayed > 0 
        ? Math.round((team.totalWins / team.totalMatchesPlayed) * 100) 
        : 0,
      isActive: team.isActive,
      createdAt: team.createdAt,
    }));

    return NextResponse.json({
      teams: leaderboard,
      total: leaderboard.length,
      activeCount: teams.filter(t => t.isActive).length,
    });
  } catch (error) {
    console.error("Error fetching teams leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams leaderboard" },
      { status: 500 }
    );
  }
}
