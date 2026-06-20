/**
 * Matches API Route
 * Handles match creation and listing (singles and doubles)
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";
import { calculateEloChange, calculateDoublesEloChange, getTeamElo } from "@/lib/elo";

// Validation constants
const MIN_SCORE = 3;
const MAX_SCORE = 21;

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

    const [matches, total] = await Promise.all([
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
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.match.count({ where }),
    ]);

    return NextResponse.json({
      matches,
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
            include: { player1: true, player2: true, season: true }
          });
          if (!team1) {
            return NextResponse.json({ error: "Team 1 not found" }, { status: 404 });
          }
          if (!team1.season.isActive) {
            return NextResponse.json({ error: "Team 1 is from a previous season. Teams expire each season." }, { status: 400 });
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
            include: { player1: true, player2: true, season: true }
          });
          if (!team2) {
            return NextResponse.json({ error: "Team 2 not found" }, { status: 404 });
          }
          if (!team2.season.isActive) {
            return NextResponse.json({ error: "Team 2 is from a previous season. Teams expire each season." }, { status: 400 });
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
            wins: team1Won ? { increment: 1 } : undefined,
            losses: team1Won ? undefined : { increment: 1 },
            matchesPlayed: { increment: 1 },
          }
        }).catch(() => {});
      }

      if (usedTeam2Id) {
        await prisma.team.update({
          where: { id: usedTeam2Id },
          data: {
            wins: !team1Won ? { increment: 1 } : undefined,
            losses: !team1Won ? undefined : { increment: 1 },
            matchesPlayed: { increment: 1 },
          }
        }).catch(() => {});
      }

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

        const updates = [
          { id: t1p1Id, change: eloResult.individualChanges.team1Player1, currentElo: p1.doublesForeverElo, currentSeasonElo: p1.doublesSeasonElo },
          { id: t1p2Id, change: eloResult.individualChanges.team1Player2, currentElo: p2.doublesForeverElo, currentSeasonElo: p2.doublesSeasonElo },
          { id: t2p1Id, change: eloResult.individualChanges.team2Player1, currentElo: p3.doublesForeverElo, currentSeasonElo: p3.doublesSeasonElo },
          { id: t2p2Id, change: eloResult.individualChanges.team2Player2, currentElo: p4.doublesForeverElo, currentSeasonElo: p4.doublesSeasonElo },
        ];

        for (const update of updates) {
          await tx.user.update({
            where: { id: update.id },
            data: {
              doublesForeverElo: update.currentElo + update.change,
              doublesMatchesPlayed: { increment: 1 },
            },
          });

          if (currentSeason) {
            const seasonChange = isTournamentMatch ? update.change : Math.round(update.change * 0.9);
            await tx.user.update({
              where: { id: update.id },
              data: { doublesSeasonElo: update.currentSeasonElo + seasonChange },
            });
          }
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
        prisma.user.findUnique({ where: { id: player1Id } }),
        prisma.user.findUnique({ where: { id: player2Id } }),
      ]);

      if (!player1 || !player2) {
        return NextResponse.json(
          { error: "One or both players not found" },
          { status: 404 }
        );
      }

      if (player1.isBanned || player2.isBanned) {
        return NextResponse.json(
          { error: "One or both players are banned" },
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

      match = await prisma.$transaction(async (tx) => {
        const newMatch = await tx.match.create({
          data: {
            matchType: "SINGLES",
            player1Id,
            player2Id,
            player1Score,
            player2Score,
            winnerId,
            player1EloBefore: player1.foreverElo,
            player2EloBefore: player2.foreverElo,
            player1EloChange: eloResult.player1Change,
            player2EloChange: eloResult.player2Change,
            isTournamentMatch: isTournamentMatch || false,
            tournamentId: tournamentId || null,
            seasonId: currentSeason?.id || null,
            createdById: userId,
          },
          include: {
            player1: { select: { id: true, name: true, image: true, foreverElo: true, seasonElo: true } },
            player2: { select: { id: true, name: true, image: true, foreverElo: true, seasonElo: true } },
          },
        });

        await tx.user.update({
          where: { id: player1Id },
          data: { foreverElo: player1.foreverElo + eloResult.player1Change, matchesPlayed: { increment: 1 } },
        });

        await tx.user.update({
          where: { id: player2Id },
          data: { foreverElo: player2.foreverElo + eloResult.player2Change, matchesPlayed: { increment: 1 } },
        });

        if (currentSeason) {
          await tx.user.update({
            where: { id: player1Id },
            data: { seasonElo: player1.seasonElo + (isTournamentMatch ? eloResult.player1Change : Math.round(eloResult.player1Change * 0.9)) },
          });
          await tx.user.update({
            where: { id: player2Id },
            data: { seasonElo: player2.seasonElo + (isTournamentMatch ? eloResult.player2Change : Math.round(eloResult.player2Change * 0.9)) },
          });
        }

        return newMatch;
      });
    }

    return NextResponse.json({ match, eloChange: eloChangeResult, matchType: matchType || "SINGLES" }, { status: 201 });
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}
