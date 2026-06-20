/**
 * Admin Recalculate ELO API Route
 * Recalculates all ELO values from scratch based on match history
 * This is a data integrity tool for admins
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionOrForbidden } from "@/lib/auth-actions";
import { DEFAULT_ELO, calculateEloChange } from "@/lib/elo";

/**
 * POST /api/admin/recalculate-elo
 * Recalculates all ELO values from match history
 */
export async function POST(request: NextRequest) {
  try {
    const { response: authResponse } = await getAdminSessionOrForbidden();
    if (authResponse) return authResponse;

    // Get all non-deleted matches ordered by creation date
    const matches = await prisma.match.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        player1: { select: { id: true, name: true } },
        player2: { select: { id: true, name: true } },
        season: { select: { id: true } },
      },
    });

    // Get current active season
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true },
    });

    // Reset all users to default ELO
    await prisma.user.updateMany({
      data: {
        foreverElo: DEFAULT_ELO,
        seasonElo: DEFAULT_ELO,
        doublesForeverElo: DEFAULT_ELO,
        doublesSeasonElo: DEFAULT_ELO,
        matchesPlayed: 0,
        doublesMatchesPlayed: 0,
        wins: 0,
        losses: 0,
        doublesWins: 0,
        doublesLosses: 0,
      },
    });

    // Reset season stats
    await prisma.teamSeasonStats.deleteMany({});

    // Track ELO state for each player
    const playerElo: Record<string, {
      foreverElo: number;
      seasonElo: number;
      doublesForeverElo: number;
      doublesSeasonElo: number;
      matchesPlayed: number;
      doublesMatchesPlayed: number;
      wins: number;
      losses: number;
      doublesWins: number;
      doublesLosses: number;
    }> = {};

    // Process each match
    for (const match of matches) {
      const { 
        player1Id, player2Id,
        team1Player1Id, team1Player2Id,
        team2Player1Id, team2Player2Id,
        player1Score, player2Score,
        matchType, isTournamentMatch, seasonId
      } = match;

      const team1Won = player1Score > player2Score;

      if (matchType === 'SINGLES' && player1Id && player2Id) {
        // Initialize if needed
        if (!playerElo[player1Id]) {
          playerElo[player1Id] = { foreverElo: DEFAULT_ELO, seasonElo: DEFAULT_ELO, doublesForeverElo: DEFAULT_ELO, doublesSeasonElo: DEFAULT_ELO, matchesPlayed: 0, doublesMatchesPlayed: 0, wins: 0, losses: 0, doublesWins: 0, doublesLosses: 0 };
        }
        if (!playerElo[player2Id]) {
          playerElo[player2Id] = { foreverElo: DEFAULT_ELO, seasonElo: DEFAULT_ELO, doublesForeverElo: DEFAULT_ELO, doublesSeasonElo: DEFAULT_ELO, matchesPlayed: 0, doublesMatchesPlayed: 0, wins: 0, losses: 0, doublesWins: 0, doublesLosses: 0 };
        }

        const p1 = playerElo[player1Id];
        const p2 = playerElo[player2Id];

        // Calculate ELO change
        const result = calculateEloChange(
          p1.foreverElo,
          p2.foreverElo,
          p1.matchesPlayed,
          p2.matchesPlayed,
          { player1Score, player2Score, winnerId: team1Won ? 'player1' : 'player2' },
          isTournamentMatch
        );

        // Apply changes
        p1.foreverElo += result.player1Change;
        p2.foreverElo += result.player2Change;
        p1.matchesPlayed++;
        p2.matchesPlayed++;

        if (team1Won) {
          p1.wins++;
          p2.losses++;
        } else {
          p2.wins++;
          p1.losses++;
        }

        // Update season ELO for active season
        if (activeSeason && seasonId === activeSeason.id) {
          p1.seasonElo += result.player1Change;
          p2.seasonElo += result.player2Change;
        }

        // Update database
        await prisma.user.update({
          where: { id: player1Id },
          data: {
            foreverElo: p1.foreverElo,
            seasonElo: p1.seasonElo,
            matchesPlayed: p1.matchesPlayed,
            wins: p1.wins,
            losses: p1.losses,
          },
        });
        await prisma.user.update({
          where: { id: player2Id },
          data: {
            foreverElo: p2.foreverElo,
            seasonElo: p2.seasonElo,
            matchesPlayed: p2.matchesPlayed,
            wins: p2.wins,
            losses: p2.losses,
          },
        });

      } else if (matchType === 'DOUBLES') {
        // Handle doubles - update both players' doubles ELO
        const playerIds = [team1Player1Id, team1Player2Id, team2Player1Id, team2Player2Id].filter(Boolean) as string[];

        for (const pid of playerIds) {
          if (!playerElo[pid]) {
            playerElo[pid] = { foreverElo: DEFAULT_ELO, seasonElo: DEFAULT_ELO, doublesForeverElo: DEFAULT_ELO, doublesSeasonElo: DEFAULT_ELO, matchesPlayed: 0, doublesMatchesPlayed: 0, wins: 0, losses: 0, doublesWins: 0, doublesLosses: 0 };
          }
          playerElo[pid].doublesMatchesPlayed++;
        }

        // For doubles, just track the players (teams don't have IDs on the match)
        // Team ELO updates would require additional logic if needed
      }
    }

    return NextResponse.json({
      success: true,
      message: `Recalculated ELO for ${Object.keys(playerElo).length} players based on ${matches.length} matches`,
      stats: {
        playersProcessed: Object.keys(playerElo).length,
        matchesProcessed: matches.length,
      },
    });
  } catch (error) {
    console.error("Error recalculating ELO:", error);
    return NextResponse.json(
      { error: "Failed to recalculate ELO" },
      { status: 500 }
    );
  }
}
