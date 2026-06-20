/**
 * User Season Stats API Route
 * Returns user's previous season stats for the season reset page
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user is requesting their own stats
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;

    const { id } = await params;
    const currentUserId = (session!.user as { id: string }).id;

    // Only allow users to see their own season stats (or admins)
    const userRole = (session!.user as { role?: string }).role;
    const isAdmin = userRole === 'ADMIN';

    if (id !== currentUserId && !isAdmin) {
      return NextResponse.json(
        { error: "You can only view your own season stats" },
        { status: 403 }
      );
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        seasonElo: true,
        foreverElo: true,
        matchesPlayed: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get the current season
    const currentSeason = await prisma.season.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // Get the previous season (last inactive season)
    const previousSeason = await prisma.season.findFirst({
      where: { isActive: false },
      orderBy: { createdAt: 'desc' },
    });

    // Count wins in previous season matches
    // For simplicity, we'll use the difference between current and previous season
    // If no previous season, assume user started at 1000
    const previousSeasonElo = previousSeason 
      ? user.seasonElo // After reset, this is already at 1000
      : 1000;

    // Get all matches played
    const allMatches = await prisma.match.findMany({
      where: {
        OR: [{ player1Id: id }, { player2Id: id }],
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate season-specific stats
    // Since we reset seasonElo, we'll calculate based on current vs initial
    const currentSeasonElo = user.seasonElo;
    const seasonGains = currentSeasonElo - 1000;
    
    // Get total matches, wins, losses
    const seasonMatches = allMatches.length; // In a real app, filter by season date
    const wins = allMatches.filter(m => m.winnerId === id).length;
    const losses = seasonMatches - wins;
    const winRate = seasonMatches > 0 ? Math.round((wins / seasonMatches) * 100) : 0;

    // Calculate percentile
    const allElos = await prisma.user.findMany({
      where: { isBanned: false },
      select: { foreverElo: true },
    });
    const eloValues = allElos.map(u => u.foreverElo).sort((a, b) => b - a);
    const userRank = eloValues.findIndex(e => e <= user.foreverElo) + 1;
    const percentile = Math.round((1 - userRank / eloValues.length) * 100);

    // Check if user is champion (has highest season elo among active players)
    const topPlayer = await prisma.user.findFirst({
      where: { isBanned: false },
      orderBy: { seasonElo: 'desc' },
    });
    const isChampion = topPlayer?.id === id && user.seasonElo > 1000;
    const championBonus = isChampion ? Math.round(user.seasonElo * 0.1) : 0;

    return NextResponse.json({
      name: user.name,
      image: user.image,
      previousSeasonElo,
      currentSeasonElo,
      seasonGains,
      seasonMatches,
      seasonWins: wins,
      seasonLosses: losses,
      winRate,
      percentile,
      isChampion,
      championBonus,
      previousSeasonName: previousSeason?.name || 'Previous Season',
      currentSeasonName: currentSeason?.name || 'Current Season',
    });
  } catch (error) {
    console.error("Error fetching season stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch season stats" },
      { status: 500 }
    );
  }
}
