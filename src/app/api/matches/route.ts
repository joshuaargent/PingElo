/**
 * Matches API Route
 * Handles match creation and listing (singles and doubles)
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";
import { calculateEloChange, calculateDoublesEloChange, getTeamElo, getTeamKFactor, calculateStreak, calculateStreakBonus, getPlayerTier, checkTierCrossing } from "@/lib/elo";
import { checkAchievements, checkSpecialAchievements, getAchievementDef, ACHIEVEMENTS } from "@/lib/achievements";
import { autoCompleteChallenges, updateTeamStreaks } from "@/lib/match-helpers";

// Validation constants
const MIN_SCORE = 3;
const MAX_SCORE = 21;
const MATCH_COOLDOWN_MS = 60000; // 60 seconds between same matchup to prevent race conditions
const MAX_RECENT_MATCHES = 10; // Max recent matches to check

/**
 * GET /api/matches - List matches with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const playerId = searchParams.get("playerId") || searchParams.get("userId");
    const seasonId = searchParams.get("seasonId");
    const tournamentId = searchParams.get("tournamentId");
    const matchType = searchParams.get("matchType");
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (playerId) {
      where.OR = [
        { player1Id: playerId },
        { player2Id: playerId },
        { team1Player1Id: playerId },
        { team1Player2Id: playerId },
        { team2Player1Id: playerId },
        { team2Player2Id: playerId },
      ];
    }

    if (seasonId) {
      where.seasonId = seasonId;
    }

    if (tournamentId) {
      where.tournamentId = tournamentId;
    }

    if (matchType) {
      where.matchType = matchType;
    }

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const [rawMatches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          player1: {
            select: {
              id: true,
              name: true,
              image: true,
              foreverElo: true,
              seasonElo: true,
            },
          },
          player2: {
            select: {
              id: true,
              name: true,
              image: true,
              foreverElo: true,
              seasonElo: true,
            },
          },
          team1Player1: {
            select: {
              id: true,
              name: true,
              image: true,
              doublesForeverElo: true,
            },
          },
          team1Player2: {
            select: {
              id: true,
              name: true,
              image: true,
              doublesForeverElo: true,
            },
          },
          team2Player1: {
            select: {
              id: true,
              name: true,
              image: true,
              doublesForeverElo: true,
            },
          },
          team2Player2: {
            select: {
              id: true,
              name: true,
              image: true,
              doublesForeverElo: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          eloHistory: {
            orderBy: { createdAt: 'desc' },
            take: 4, // Get entries for all players in the match
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.match.count({ where }),
    ]);

    // Transform matches to include streak bonus per player
    const matchesWithStreak = rawMatches.map((match) => {
      const streakBonus: { player1: number; player2: number } = { player1: 0, player2: 0 };
      const m = match as any;
      
      // Find streak bonus for each player from ELO history
      (m.eloHistory || []).forEach((history: any) => {
        const metadata = history.metadata as Record<string, unknown> | null;
        if (metadata?.streakBonus && typeof metadata.streakBonus === 'number') {
          // Determine if this player is player1 or player2 based on the match
          if (match.matchType === 'SINGLES') {
            if (history.userId === match.player1Id) {
              streakBonus.player1 = metadata.streakBonus as number;
            } else {
              streakBonus.player2 = metadata.streakBonus as number;
            }
          }
          // For doubles, we could extend this later
        }
      });

      return {
        ...match,
        eloHistory: undefined, // Remove raw history from response
        streakBonus: streakBonus.player1 > 0 || streakBonus.player2 > 0 ? streakBonus : undefined,
      };
    });

    return NextResponse.json({
      matches: matchesWithStreak,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/matches - Create a new match (singles or doubles)
 */
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;

    const userId = session!.user.id;

    const body = await request.json();
    const {
      matchType,
      player1Id,
      player2Id,
      team1Player1Id,
      team1Player2Id,
      team2Player1Id,
      team2Player2Id,
      team1Id,
      team2Id,
      player1Score,
      player2Score,
      isTournamentMatch,
      tournamentId,
    } = body;

    // Validate scores
    if (player1Score < MIN_SCORE || player1Score > MAX_SCORE ||
        player2Score < MIN_SCORE || player2Score > MAX_SCORE) {
      return NextResponse.json(
        { error: `Scores must be between ${MIN_SCORE} and ${MAX_SCORE}` },
        { status: 400 }
      );
    }

    const currentSeason = await prisma.season.findFirst({
      where: { isActive: true },
    });

    // Check for duplicate/rapid match submissions (race condition prevention)
    if (matchType !== "DOUBLES" && player1Id && player2Id) {
      const recentMatches = await prisma.match.findMany({
        where: {
          OR: [
            { player1Id, player2Id },
            { player1Id: player2Id, player2Id: player1Id },
          ],
          createdAt: {
            gte: new Date(Date.now() - MATCH_COOLDOWN_MS),
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      });

      if (recentMatches.length > 0) {
        return NextResponse.json(
          { error: "Please wait before logging another match between these players" },
          { status: 429 }
        );
      }
    }

    let match;
    let eloChangeResult;

    if (matchType === "DOUBLES") {
      // DOUBLES MATCH
      let t1p1Id = team1Player1Id;
      let t1p2Id = team1Player2Id;
      let t2p1Id = team2Player1Id;
      let t2p2Id = team2Player2Id;
      let usedTeam1Id = team1Id;
      let usedTeam2Id = team2Id;

      // FOR TOURNAMENTS: Require registered teams only (no ad-hoc)
      if (isTournamentMatch) {
        // Both teams must be registered teams in the current season
        if (!usedTeam1Id && !usedTeam2Id) {
          return NextResponse.json(
            { error: "Tournament doubles matches require registered teams. Please select your team." },
            { status: 400 }
          );
        }
        
        // Validate team1
        if (usedTeam1Id) {
          const team1 = await prisma.team.findUnique({
            where: { id: usedTeam1Id },
            include: { player1: true, player2: true }
          });
          if (!team1) {
            return NextResponse.json({ error: "Team 1 not found" }, { status: 404 });
          }
          if (!team1.isActive) {
            return NextResponse.json({ error: "Team 1 is from a previous season. Please reactivate your team." }, { status: 400 });
          }
          // Check if user is actually on this team
          const allTeam1Players = [team1.player1Id, team1.player2Id];
          if (!allTeam1Players.includes(userId)) {
            return NextResponse.json({ error: "You can only use teams you're a member of" }, { status: 403 });
          }
          t1p1Id = team1.player1Id;
          t1p2Id = team1.player2Id;
        } else {
          return NextResponse.json({ error: "Tournament matches require registered teams for Team 1" }, { status: 400 });
        }
        
        // Validate team2
        if (usedTeam2Id) {
          const team2 = await prisma.team.findUnique({
            where: { id: usedTeam2Id },
            include: { player1: true, player2: true }
          });
          if (!team2) {
            return NextResponse.json({ error: "Team 2 not found" }, { status: 404 });
          }
          if (!team2.isActive) {
            return NextResponse.json({ error: "Team 2 is from a previous season. Please reactivate your team." }, { status: 400 });
          }
          t2p1Id = team2.player1Id;
          t2p2Id = team2.player2Id;
        } else {
          return NextResponse.json({ error: "Tournament matches require registered teams for Team 2" }, { status: 400 });
        }
      } else {
        // FOR NON-TOURNAMENT (CASUAL): Allow ad-hoc teams with individual player IDs
        // If team IDs are provided, resolve them to player IDs
        if (usedTeam1Id && !t1p1Id) {
          const team1 = await prisma.team.findUnique({
            where: { id: usedTeam1Id },
            include: { player1: true, player2: true }
          });
          if (!team1) {
            return NextResponse.json({ error: "Team 1 not found" }, { status: 404 });
          }
          t1p1Id = team1.player1Id;
          t1p2Id = team1.player2Id;
        }

        if (usedTeam2Id && !t2p1Id) {
          const team2 = await prisma.team.findUnique({
            where: { id: usedTeam2Id },
            include: { player1: true, player2: true }
          });
          if (!team2) {
            return NextResponse.json({ error: "Team 2 not found" }, { status: 404 });
          }
          t2p1Id = team2.player1Id;
          t2p2Id = team2.player2Id;
        }
      }

      if (!t1p1Id || !t1p2Id || !t2p1Id || !t2p2Id) {
        return NextResponse.json(
          { error: "Doubles requires all 4 player IDs" },
          { status: 400 }
        );
      }

      const playerIds = [t1p1Id, t1p2Id, t2p1Id, t2p2Id];
      const uniqueIds = new Set(playerIds);
      if (uniqueIds.size !== 4) {
        return NextResponse.json(
          { error: "All 4 players must be different" },
          { status: 400 }
        );
      }

      const players = await prisma.user.findMany({
        where: { id: { in: playerIds } },
        select: { 
          id: true, name: true, isBanned: true, 
          doublesForeverElo: true, doublesMatchesPlayed: true, doublesSeasonElo: true, 
          currentStreak: true, longestStreak: true, lastMatchDate: true,
          todayStreakBonus: true, lastBonusResetDate: true,
        },
      });

      if (players.length !== 4) {
        return NextResponse.json(
          { error: "One or more players not found" },
          { status: 404 }
        );
      }

      const bannedPlayer = players.find(p => p.isBanned);
      if (bannedPlayer) {
        return NextResponse.json(
          { error: `${bannedPlayer.name} is banned` },
          { status: 403 }
        );
      }

      // Check for duplicate/rapid match submissions (race condition prevention) for doubles
      const recentDoublesMatch = await prisma.match.findFirst({
        where: {
          matchType: "DOUBLES",
          OR: [
            // Same 4 players in same positions (order matters for teams, so exact match)
            {
              AND: [
                { team1Player1Id: t1p1Id },
                { team1Player2Id: t1p2Id },
                { team2Player1Id: t2p1Id },
                { team2Player2Id: t2p2Id },
              ]
            },
            // Same 4 players but teams swapped
            {
              AND: [
                { team1Player1Id: t2p1Id },
                { team1Player2Id: t2p2Id },
                { team2Player1Id: t1p1Id },
                { team2Player2Id: t1p2Id },
              ]
            },
          ],
          createdAt: {
            gte: new Date(Date.now() - MATCH_COOLDOWN_MS),
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      });

      if (recentDoublesMatch) {
        return NextResponse.json(
          { error: "Please wait before logging another match between these teams" },
          { status: 429 }
        );
      }

      const playerMap = new Map(players.map(p => [p.id, p]));
      const p1 = playerMap.get(t1p1Id)!;
      const p2 = playerMap.get(t1p2Id)!;
      const p3 = playerMap.get(t2p1Id)!;
      const p4 = playerMap.get(t2p2Id)!;

      const team1Elo = getTeamElo(p1.doublesForeverElo, p2.doublesForeverElo);
      const team2Elo = getTeamElo(p3.doublesForeverElo, p4.doublesForeverElo);
      const team1Won = player1Score > player2Score;
      const winnerId = team1Won ? t1p1Id : t2p1Id;

      const eloResult = calculateDoublesEloChange(
        p1.doublesForeverElo,
        p2.doublesForeverElo,
        p3.doublesForeverElo,
        p4.doublesForeverElo,
        p1.doublesMatchesPlayed,
        p2.doublesMatchesPlayed,
        p3.doublesMatchesPlayed,
        p4.doublesMatchesPlayed,
        team1Won,
        player1Score,
        player2Score,
        isTournamentMatch || false
      );

      eloChangeResult = eloResult;

      // Update team stats if team IDs were provided
      if (usedTeam1Id) {
        await prisma.team.update({
          where: { id: usedTeam1Id },
          data: {
            totalWins: team1Won ? { increment: 1 } : undefined,
            totalLosses: team1Won ? undefined : { increment: 1 },
            totalMatchesPlayed: { increment: 1 },
          }
        }).catch(() => {});
        
        // Update current season stats
        if (currentSeason) {
          await prisma.teamSeasonStats.updateMany({
            where: { teamId: usedTeam1Id, seasonId: currentSeason.id },
            data: {
              wins: team1Won ? { increment: 1 } : undefined,
              losses: team1Won ? undefined : { increment: 1 },
              matchesPlayed: { increment: 1 },
            }
          }).catch(() => {});
        }
      }

      if (usedTeam2Id) {
        await prisma.team.update({
          where: { id: usedTeam2Id },
          data: {
            totalWins: !team1Won ? { increment: 1 } : undefined,
            totalLosses: !team1Won ? undefined : { increment: 1 },
            totalMatchesPlayed: { increment: 1 },
          }
        }).catch(() => {});
        
        // Update current season stats
        if (currentSeason) {
          await prisma.teamSeasonStats.updateMany({
            where: { teamId: usedTeam2Id, seasonId: currentSeason.id },
            data: {
              wins: !team1Won ? { increment: 1 } : undefined,
              losses: !team1Won ? undefined : { increment: 1 },
              matchesPlayed: { increment: 1 },
            }
          }).catch(() => {});
        }
      }

      // Store ELO values before changes and calculate streaks
      const p1Streak = calculateStreak(p1.lastMatchDate, p1.currentStreak, p1.longestStreak);
      const p2Streak = calculateStreak(p2.lastMatchDate, p2.currentStreak, p2.longestStreak);
      const p3Streak = calculateStreak(p3.lastMatchDate, p3.currentStreak, p3.longestStreak);
      const p4Streak = calculateStreak(p4.lastMatchDate, p4.currentStreak, p4.longestStreak);
      
      const team1Players = [
        { id: t1p1Id, name: p1.name, eloBefore: p1.doublesForeverElo, change: eloResult.individualChanges.team1Player1, seasonEloBefore: p1.doublesSeasonElo, streak: p1Streak, todayStreakBonus: p1.todayStreakBonus, lastBonusResetDate: p1.lastBonusResetDate },
        { id: t1p2Id, name: p2.name, eloBefore: p2.doublesForeverElo, change: eloResult.individualChanges.team1Player2, seasonEloBefore: p2.doublesSeasonElo, streak: p2Streak, todayStreakBonus: p2.todayStreakBonus, lastBonusResetDate: p2.lastBonusResetDate },
      ];
      const team2Players = [
        { id: t2p1Id, name: p3.name, eloBefore: p3.doublesForeverElo, change: eloResult.individualChanges.team2Player1, seasonEloBefore: p3.doublesSeasonElo, streak: p3Streak, todayStreakBonus: p3.todayStreakBonus, lastBonusResetDate: p3.lastBonusResetDate },
        { id: t2p2Id, name: p4.name, eloBefore: p4.doublesForeverElo, change: eloResult.individualChanges.team2Player2, seasonEloBefore: p4.doublesSeasonElo, streak: p4Streak, todayStreakBonus: p4.todayStreakBonus, lastBonusResetDate: p4.lastBonusResetDate },
      ];

      match = await prisma.$transaction(async (tx) => {
        const newMatch = await tx.match.create({
          data: {
            matchType: "DOUBLES",
            team1Player1Id: t1p1Id,
            team1Player2Id: t1p2Id,
            team2Player1Id: t2p1Id,
            team2Player2Id: t2p2Id,
            player1Score,
            player2Score,
            winnerId,
            player1EloBefore: team1Elo,
            player2EloBefore: team2Elo,
            player1EloChange: eloResult.team1Change,
            player2EloChange: eloResult.team2Change,
            isTournamentMatch: isTournamentMatch || false,
            tournamentId: tournamentId || null,
            seasonId: currentSeason?.id || null,
            createdById: userId,
          },
          include: {
            team1Player1: { select: { id: true, name: true, image: true, doublesForeverElo: true } },
            team1Player2: { select: { id: true, name: true, image: true, doublesForeverElo: true } },
            team2Player1: { select: { id: true, name: true, image: true, doublesForeverElo: true } },
            team2Player2: { select: { id: true, name: true, image: true, doublesForeverElo: true } },
          },
        });

        const allUpdates = [...team1Players, ...team2Players];
        for (const update of allUpdates) {
          const streakResult = calculateStreakBonus(update.streak.newStreak, update.todayStreakBonus, update.lastBonusResetDate);
          const isWinner = update.change > 0;
          
          await tx.user.update({
            where: { id: update.id },
            data: {
              doublesForeverElo: update.eloBefore + update.change + streakResult.bonus,
              doublesMatchesPlayed: { increment: 1 },
              currentStreak: update.streak.newStreak,
              longestStreak: update.streak.newLongestStreak,
              lastMatchDate: new Date(),
              todayStreakBonus: streakResult.resetDaily ? 0 : streakResult.newDailyTotal,
              lastBonusResetDate: new Date(),
              // Weekly stats
              weeklyEloGained: { increment: Math.max(0, update.change + streakResult.bonus) },
              weeklyMatchesPlayed: { increment: 1 },
              weeklyWins: isWinner ? { increment: 1 } : undefined,
            },
          });

          if (currentSeason) {
            await tx.user.update({
              where: { id: update.id },
              data: { doublesSeasonElo: update.seasonEloBefore + update.change + streakResult.bonus },
            });
          }
        }

        // Create ELO history entries for all 4 players
        for (const player of allUpdates) {
          const streakResult = calculateStreakBonus(player.streak.newStreak, player.todayStreakBonus, player.lastBonusResetDate);
          await tx.eloHistory.create({
            data: {
              userId: player.id,
              matchId: newMatch.id,
              changeType: 'MATCH',
              eloBefore: player.eloBefore,
              eloAfter: player.eloBefore + player.change + streakResult.bonus,
              change: player.change,
              description: isTournamentMatch ? `Doubles match (Tournament)` : 'Doubles match',
              metadata: {
                matchType: 'DOUBLES',
                team1Players: team1Players.map(p => ({ id: p.id, name: p.name })),
                team2Players: team2Players.map(p => ({ id: p.id, name: p.name })),
                player1Score,
                player2Score,
                winnerId,
                isTournamentMatch,
                tournamentId,
                streakBonus: streakResult.bonus,
                streakBefore: player.streak.newStreak - 1,
                streakAfter: player.streak.newStreak,
              },
            },
          });
        }

        return newMatch;
      });

    } else {
      // SINGLES MATCH
      if (!player1Id || !player2Id) {
        return NextResponse.json(
          { error: "Singles requires player1Id and player2Id" },
          { status: 400 }
        );
      }

      if (player1Id === player2Id) {
        return NextResponse.json(
          { error: "Player 1 and Player 2 must be different" },
          { status: 400 }
        );
      }

      const [player1, player2] = await Promise.all([
        prisma.user.findUnique({ where: { id: player1Id }, select: { id: true, name: true, isBanned: true, banReason: true, foreverElo: true, seasonElo: true, matchesPlayed: true, currentStreak: true, longestStreak: true, lastMatchDate: true, todayStreakBonus: true, lastBonusResetDate: true } }),
        prisma.user.findUnique({ where: { id: player2Id }, select: { id: true, name: true, isBanned: true, banReason: true, foreverElo: true, seasonElo: true, matchesPlayed: true, currentStreak: true, longestStreak: true, lastMatchDate: true, todayStreakBonus: true, lastBonusResetDate: true } }),
      ]);

      if (!player1 || !player2) {
        return NextResponse.json(
          { error: "One or both players not found" },
          { status: 404 }
        );
      }

      if (player1.isBanned) {
        return NextResponse.json(
          { error: `${player1.name} is banned${player1.banReason ? `: ${player1.banReason}` : ""}` },
          { status: 403 }
        );
      }
      if (player2.isBanned) {
        return NextResponse.json(
          { error: `${player2.name} is banned${player2.banReason ? `: ${player2.banReason}` : ""}` },
          { status: 403 }
        );
      }

      const winnerId = player1Score > player2Score ? player1Id : player2Id;

      const eloResult = calculateEloChange(
        player1.foreverElo,
        player2.foreverElo,
        player1.matchesPlayed,
        player2.matchesPlayed,
        { player1Score, player2Score, winnerId: winnerId === player1Id ? "player1" : "player2" },
        isTournamentMatch || false
      );

      eloChangeResult = eloResult;

      const p1EloBefore = player1.foreverElo;
        const p2EloBefore = player2.foreverElo;
        
        const singlesResult = await prisma.$transaction(async (tx) => {
          const newMatch = await tx.match.create({
            data: {
              matchType: "SINGLES",
              player1Id,
              player2Id,
              player1Score,
              player2Score,
              winnerId,
              player1EloBefore: p1EloBefore,
              player2EloBefore: p2EloBefore,
              player1EloChange: eloResult.player1Change,
              player2EloChange: eloResult.player2Change,
              isTournamentMatch: isTournamentMatch || false,
              tournamentId: tournamentId || null,
              seasonId: currentSeason?.id || null,
              createdById: userId,
            },
            include: {
              player1: { select: { id: true, name: true, image: true, foreverElo: true, seasonElo: true, currentStreak: true, longestStreak: true, lastMatchDate: true, todayStreakBonus: true, lastBonusResetDate: true } },
              player2: { select: { id: true, name: true, image: true, foreverElo: true, seasonElo: true, currentStreak: true, longestStreak: true, lastMatchDate: true, todayStreakBonus: true, lastBonusResetDate: true } },
            },
          });

          // Calculate streak for player 1 with daily tracking
          const p1Streak = calculateStreak(player1.lastMatchDate, player1.currentStreak, player1.longestStreak);
          const p1StreakResult = calculateStreakBonus(p1Streak.newStreak, player1.todayStreakBonus, player1.lastBonusResetDate);
          const p1EloGain = eloResult.player1Change + p1StreakResult.bonus;
          
          await tx.user.update({
            where: { id: player1Id },
            data: { 
              foreverElo: player1.foreverElo + p1EloGain, 
              matchesPlayed: { increment: 1 },
              currentStreak: p1Streak.newStreak,
              longestStreak: p1Streak.newLongestStreak,
              lastMatchDate: new Date(),
              todayStreakBonus: p1StreakResult.resetDaily ? 0 : p1StreakResult.newDailyTotal,
              lastBonusResetDate: new Date(),
              // Weekly stats
              weeklyEloGained: { increment: Math.max(0, p1EloGain) },
              weeklyMatchesPlayed: { increment: 1 },
              weeklyWins: eloResult.player1Change > 0 ? { increment: 1 } : undefined,
            },
          });

          // Calculate streak for player 2 with daily tracking
          const p2Streak = calculateStreak(player2.lastMatchDate, player2.currentStreak, player2.longestStreak);
          const p2StreakResult = calculateStreakBonus(p2Streak.newStreak, player2.todayStreakBonus, player2.lastBonusResetDate);
          const p2EloGain = eloResult.player2Change + p2StreakResult.bonus;
          
          await tx.user.update({
            where: { id: player2Id },
            data: { 
              foreverElo: player2.foreverElo + p2EloGain, 
              matchesPlayed: { increment: 1 },
              currentStreak: p2Streak.newStreak,
              longestStreak: p2Streak.newLongestStreak,
              lastMatchDate: new Date(),
              todayStreakBonus: p2StreakResult.resetDaily ? 0 : p2StreakResult.newDailyTotal,
              lastBonusResetDate: new Date(),
              // Weekly stats
              weeklyEloGained: { increment: Math.max(0, p2EloGain) },
              weeklyMatchesPlayed: { increment: 1 },
              weeklyWins: eloResult.player2Change > 0 ? { increment: 1 } : undefined,
            },
          });

          if (currentSeason) {
            await tx.user.update({
              where: { id: player1Id },
              data: { seasonElo: player1.seasonElo + eloResult.player1Change + p1StreakResult.bonus },
            });
            await tx.user.update({
              where: { id: player2Id },
              data: { seasonElo: player2.seasonElo + eloResult.player2Change + p2StreakResult.bonus },
            });
          }

          // Create ELO history entries for both players (including streak bonus in final ELO)
          const p1EloAfter = p1EloBefore + eloResult.player1Change + p1StreakResult.bonus;
          const p2EloAfter = p2EloBefore + eloResult.player2Change + p2StreakResult.bonus;
          
          // Get week start for weekly activity tracking
          const now = new Date();
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          const weekStart = new Date(now.setDate(diff));
          weekStart.setHours(0, 0, 0, 0);
          
          // Update weekly activity for both players
          const p1Won = winnerId === player1Id;
          const p2Won = winnerId === player2Id;
          
          await tx.weeklyActivity.upsert({
            where: {
              userId_weekStart: { userId: player1Id, weekStart },
            },
            update: {
              matchesPlayed: { increment: 1 },
              wins: p1Won ? { increment: 1 } : undefined,
              eloChange: { increment: eloResult.player1Change + p1StreakResult.bonus },
              isQualified: true,
            },
            create: {
              userId: player1Id,
              weekStart,
              matchesPlayed: 1,
              wins: p1Won ? 1 : 0,
              eloChange: eloResult.player1Change + p1StreakResult.bonus,
              isQualified: true,
            },
          });
          
          await tx.weeklyActivity.upsert({
            where: {
              userId_weekStart: { userId: player2Id, weekStart },
            },
            update: {
              matchesPlayed: { increment: 1 },
              wins: p2Won ? { increment: 1 } : undefined,
              eloChange: { increment: eloResult.player2Change + p2StreakResult.bonus },
              isQualified: true,
            },
            create: {
              userId: player2Id,
              weekStart,
              matchesPlayed: 1,
              wins: p2Won ? 1 : 0,
              eloChange: eloResult.player2Change + p2StreakResult.bonus,
              isQualified: true,
            },
          });
          
          await tx.eloHistory.create({
            data: {
              userId: player1Id,
              matchId: newMatch.id,
              changeType: 'MATCH',
              eloBefore: p1EloBefore,
              eloAfter: p1EloAfter,
              change: eloResult.player1Change,
              description: isTournamentMatch ? `Match vs ${player2.name} (Tournament)` : `Match vs ${player2.name}`,
              metadata: {
                opponentId: player2Id,
                opponentName: player2.name,
                player1Score,
                player2Score,
                winnerId,
                isTournamentMatch,
                tournamentId,
                streakBonus: p1StreakResult.bonus,
                streakBefore: player1.currentStreak,
                streakAfter: p1Streak.newStreak,
              },
            },
          });

          await tx.eloHistory.create({
            data: {
              userId: player2Id,
              matchId: newMatch.id,
              changeType: 'MATCH',
              eloBefore: p2EloBefore,
              eloAfter: p2EloAfter,
              change: eloResult.player2Change,
              description: isTournamentMatch ? `Match vs ${player1.name} (Tournament)` : `Match vs ${player1.name}`,
              metadata: {
                opponentId: player1Id,
                opponentName: player1.name,
                player1Score,
                player2Score,
                winnerId,
                isTournamentMatch,
                tournamentId,
                streakBonus: p2StreakResult.bonus,
                streakBefore: player2.currentStreak,
                streakAfter: p2Streak.newStreak,
              },
            },
          });

          return {
            match: newMatch,
            streakBonus: { player1: p1StreakResult.bonus, player2: p2StreakResult.bonus },
            newStreak: { player1: p1Streak.newStreak, player2: p2Streak.newStreak },
            milestone: {
              player1: p1Streak.milestoneHit,
              player2: p2Streak.milestoneHit,
            },
            tier: {
              player1: checkTierCrossing(p1EloBefore, p1EloBefore + eloResult.player1Change + p1StreakResult.bonus),
              player2: checkTierCrossing(p2EloBefore, p2EloBefore + eloResult.player2Change + p2StreakResult.bonus),
            },
          };
        });
        
        // Singles response with streak info
        // Auto-complete any active challenges between these players
        await autoCompleteChallenges(
          player1Id!,
          player2Id!,
          winnerId,
          singlesResult.match.id,
          'SINGLES'
        );
        
        // Log activity for match (non-blocking)
        prisma.activity.create({
          data: {
            type: 'MATCH',
            message: `Match completed`,
            metadata: { matchId: singlesResult.match.id, player1Id, player2Id, winnerId },
            userId: userId,
            matchId: singlesResult.match.id,
          },
        }).catch(() => {});
        
        return NextResponse.json({ 
          match: singlesResult.match, 
          eloChange: eloChangeResult, 
          matchType: "SINGLES",
          streakBonus: singlesResult.streakBonus,
          newStreak: singlesResult.newStreak,
          milestone: singlesResult.milestone,
          tier: singlesResult.tier,
        }, { status: 201 });
      // Note: Singles returns inside the transaction above, so this only runs for doubles
    }

    // Doubles response - auto-complete challenges and update team streaks
    // We need to determine the winner based on which team won
    const doublesWinnerId = player1Score > player2Score ? team1Player1Id : team2Player1Id;
    if (doublesWinnerId && team1Id && team2Id) {
      await autoCompleteChallenges(
        player1Id!,
        player2Id!,
        doublesWinnerId,
        match.id,
        'DOUBLES',
        team1Player1Id!,
        team1Player2Id!,
        team2Player1Id!,
        team2Player2Id!
      );
      await updateTeamStreaks(team1Id, team2Id);
    }
    
    // Log activity for match (non-blocking)
    const winner = player1Score > player2Score ? player1Id : player2Id;
    const loser = winner === player1Id ? player2Id : player1Id;
    const activityData = match.matchType === 'DOUBLES' ? {
      type: 'DOUBLES_MATCH',
      message: `Doubles match completed`,
      metadata: { matchId: match.id, team1Id, team2Id, winnerId: doublesWinnerId },
      userId: userId,
      matchId: match.id,
    } : {
      type: 'MATCH',
      message: `Match completed`,
      metadata: { matchId: match.id, player1Id, player2Id, winnerId: winner },
      userId: userId,
      matchId: match.id,
    };
    prisma.activity.create({ data: activityData }).catch(() => {});
    
    return NextResponse.json({ match, eloChange: eloChangeResult, matchType: matchType || "DOUBLES" }, { status: 201 });
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}
