/**
 * Leaderboard API Route
 * Handles leaderboard data for rankings
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRustyStatus, checkActivityBonus } from "@/lib/elo";

/**
 * GET /api/leaderboard - Get leaderboard data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const type = searchParams.get("type") || "forever"; // "forever" or "season"

    const skip = (page - 1) * limit;

    // Get active season if requesting season leaderboard
    let seasonId: string | null = null;
    if (type === "season") {
      const activeSeason = await prisma.season.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      seasonId = activeSeason?.id || null;
    }

    // Get all users with their match data
    const users = await prisma.user.findMany({
      where: {
        isBanned: false,
      },
      select: {
        id: true,
        name: true,
        image: true,
        foreverElo: true,
        seasonElo: true,
        matchesPlayed: true,
        createdAt: true,
      },
    });

    // Get match stats for each user
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Get wins and last match for each player
    const winsData = await prisma.match.findMany({
      where: { deletedAt: null },
      select: {
        winnerId: true,
        createdAt: true,
      },
    });

    // Aggregate data
    const playerStats = new Map<string, { wins: number; lastMatch: Date | null }>();
    for (const match of winsData) {
      const existing = playerStats.get(match.winnerId);
      if (existing) {
        existing.wins += 1;
        if (!existing.lastMatch || match.createdAt > existing.lastMatch) {
          existing.lastMatch = match.createdAt;
        }
      } else {
        playerStats.set(match.winnerId, { wins: 1, lastMatch: match.createdAt });
      }
    }

    // Calculate all stats
    const leaderboardData = users.map((user) => {
      const stats = playerStats.get(user.id) || { wins: 0, lastMatch: null };
      const rustyStatus = checkRustyStatus(stats.lastMatch);
      const activityStatus = checkActivityBonus(0); // Simplified
      const losses = user.matchesPlayed - stats.wins;
      const winRate =
        user.matchesPlayed > 0
          ? Math.round((stats.wins / user.matchesPlayed) * 100 * 10) / 10
          : 0;

      return {
        userId: user.id,
        name: user.name,
        image: user.image,
        foreverElo: user.foreverElo,
        seasonElo: user.seasonElo,
        matchesPlayed: user.matchesPlayed,
        wins: stats.wins,
        losses,
        winRate,
        lastMatchDate: stats.lastMatch,
        isRusty: rustyStatus.isRusty,
        weeksSinceLastMatch: rustyStatus.weeksSinceLastMatch,
        isActive: activityStatus.qualified,
        weeklyMatches: 0,
        activityBonus: activityStatus.bonus,
        createdAt: user.createdAt,
      };
    });

    // Sort by the requested ELO type
    const sortedData = leaderboardData.sort((a, b) => {
      const eloA = type === "season" ? a.seasonElo : a.foreverElo;
      const eloB = type === "season" ? b.seasonElo : b.foreverElo;
      return eloB - eloA;
    });

    // Add rank
    const rankedData = sortedData.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    // Paginate
    const paginatedData = rankedData.slice(skip, skip + limit);

    return NextResponse.json({
      leaderboard: paginatedData,
      type,
      seasonId,
      pagination: {
        page,
        limit,
        total: rankedData.length,
        totalPages: Math.ceil(rankedData.length / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
