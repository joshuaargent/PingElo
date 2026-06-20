/**
 * Leaderboard API Route
 * Handles leaderboard data for rankings (singles and doubles)
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRustyStatus, checkActivityBonus } from "@/lib/elo";

/**
 * GET /api/leaderboard - Get leaderboard data
 * Query params:
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 50)
 *   - type: "forever" or "season" (default: "forever")
 *   - matchType: "singles", "doubles", or "all" (default: "singles")
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const type = searchParams.get("type") || "forever"; // "forever" or "season"
    const matchType = searchParams.get("matchType") || "singles"; // "singles", "doubles", or "all"

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

    // Build match filter based on matchType
    const matchTypeFilter = matchType === "all" 
      ? {} // No filter - include all
      : matchType === "doubles"
        ? { matchType: "DOUBLES" as const }
        : { matchType: "SINGLES" as const };

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
        doublesForeverElo: true,
        doublesSeasonElo: true,
        doublesMatchesPlayed: true,
        createdAt: true,
      },
    });

    // Get match stats for each user based on match type
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Get all matches with winner info
    const matchesData = await prisma.match.findMany({
      where: { 
        deletedAt: null,
        ...matchTypeFilter,
      },
      select: {
        winnerId: true,
        createdAt: true,
      },
    });

    // Get matches where user was a participant (for stats)
    const allMatches = await prisma.match.findMany({
      where: { 
        deletedAt: null,
        ...matchTypeFilter,
      },
      select: {
        winnerId: true,
        player1Id: true,
        player2Id: true,
        team1Player1Id: true,
        team1Player2Id: true,
        team2Player1Id: true,
        team2Player2Id: true,
        createdAt: true,
      },
    });

    // Aggregate data for each user
    const playerStats = new Map<string, { 
      wins: number; 
      matchesPlayed: number;
      lastMatch: Date | null 
    }>();

    for (const match of allMatches) {
      // Determine all players in this match
      const playerIds = [
        match.player1Id,
        match.player2Id,
        match.team1Player1Id,
        match.team1Player2Id,
        match.team2Player1Id,
        match.team2Player2Id,
      ].filter(Boolean) as string[];

      // Update stats for each player
      for (const playerId of playerIds) {
        const existing = playerStats.get(playerId) || { wins: 0, matchesPlayed: 0, lastMatch: null };
        existing.matchesPlayed += 1;
        if (match.winnerId === playerId) {
          existing.wins += 1;
        }
        if (!existing.lastMatch || match.createdAt > existing.lastMatch) {
          existing.lastMatch = match.createdAt;
        }
        playerStats.set(playerId, existing);
      }
    }

    // Calculate all stats
    const leaderboardData = users.map((user) => {
      const stats = playerStats.get(user.id) || { wins: 0, matchesPlayed: 0, lastMatch: null };
      
      // Use singles or doubles ELO based on matchType
      const eloData = matchType === "doubles" 
        ? {
            elo: type === "season" ? user.doublesSeasonElo : user.doublesForeverElo,
            totalMatches: user.doublesMatchesPlayed,
          }
        : {
            elo: type === "season" ? user.seasonElo : user.foreverElo,
            totalMatches: user.matchesPlayed,
          };

      const rustyStatus = checkRustyStatus(stats.lastMatch);
      const activityStatus = checkActivityBonus(0); // Simplified
      const losses = stats.matchesPlayed - stats.wins;
      const winRate =
        stats.matchesPlayed > 0
          ? Math.round((stats.wins / stats.matchesPlayed) * 100 * 10) / 10
          : 0;

      return {
        userId: user.id,
        name: user.name,
        image: user.image,
        // ELO values
        foreverElo: user.foreverElo,
        seasonElo: user.seasonElo,
        doublesForeverElo: user.doublesForeverElo,
        doublesSeasonElo: user.doublesSeasonElo,
        // Current leaderboard value
        elo: eloData.elo,
        // Stats
        matchesPlayed: stats.matchesPlayed,
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
      return b.elo - a.elo;
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
      matchType,
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
