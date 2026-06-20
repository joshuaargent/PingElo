/**
 * Users API Route
 * Handles user listing, profile retrieval, and user management
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized, getAdminSessionOrForbidden } from "@/lib/auth-actions";
import { getKFactorLabel, getEloTierLabel, checkRustyStatus, calculatePercentile } from "@/lib/elo";

// GET /api/users - List users
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "foreverElo";
    const order = searchParams.get("order") || "desc";
    const includeStats = searchParams.get("includeStats") === "true";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      isBanned: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Validate sort field
    const validSortFields = ["foreverElo", "seasonElo", "matchesPlayed", "name", "createdAt"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "foreverElo";
    const sortOrder = order === "asc" ? "asc" : "desc";

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          image: true,
          // Note: email, role, isBanned, banReason are admin-only fields
          // Public API intentionally omits these for privacy
          foreverElo: true,
          seasonElo: true,
          doublesForeverElo: true,
          doublesSeasonElo: true,
          matchesPlayed: true,
          doublesMatchesPlayed: true,
          createdAt: true,
        },
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // If includeStats is requested, add additional stats
    let responseUsers = users;
    
    if (includeStats) {
      // Get all ELOs for percentile calculation
      const allElos = await prisma.user.findMany({
        where: { isBanned: false },
        select: { foreverElo: true },
      });
      const eloValues = allElos.map(u => u.foreverElo);

      // Get last match dates for each user
      const lastMatches = await prisma.match.groupBy({
        by: ["winnerId"],
        _max: { createdAt: true },
      });
      const lastMatchMap = new Map(lastMatches.map(m => [m.winnerId, m._max.createdAt]));

      // Get wins and losses for each user
      const winCounts = await prisma.match.groupBy({
        by: ["winnerId"],
        _count: { winnerId: true },
      });
      const winMap = new Map(winCounts.map(m => [m.winnerId, m._count.winnerId]));

      responseUsers = users.map(user => {
        const lastMatchDate = lastMatchMap.get(user.id) || null;
        const rustyStatus = checkRustyStatus(lastMatchDate);
        const wins = winMap.get(user.id) || 0;
        const losses = user.matchesPlayed - wins;
        const winRate = user.matchesPlayed > 0 ? Math.round((wins / user.matchesPlayed) * 100) : 0;

        // Calculate rank based on foreverElo
        const rank = eloValues.filter(elo => elo > user.foreverElo).length + 1;

        return {
          ...user,
          wins,
          losses,
          winRate,
          rank,
          lastMatchDate,
          isRusty: rustyStatus.isRusty,
          weeksSinceLastMatch: rustyStatus.weeksSinceLastMatch,
          kFactorLabel: getKFactorLabel(user.matchesPlayed),
          eloTier: getEloTierLabel(user.foreverElo),
          percentile: calculatePercentile(user.foreverElo, eloValues),
        };
      });
    }

    return NextResponse.json({
      users: responseUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
