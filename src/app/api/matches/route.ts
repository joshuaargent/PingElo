/**
 * Matches API Route
 * Handles match creation and listing
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";
import { calculateEloChange, DEFAULT_ELO } from "@/lib/elo";
import { Prisma } from "@prisma/client";

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
    const playerId = searchParams.get("playerId");
    const seasonId = searchParams.get("seasonId");
    const tournamentId = searchParams.get("tournamentId");
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    
    if (playerId) {
      where.OR = [
        { player1Id: playerId },
        { player2Id: playerId },
      ];
    }
    
    if (seasonId) {
      where.seasonId = seasonId;
    }
    
    if (tournamentId) {
      where.tournamentId = tournamentId;
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
 * POST /api/matches - Create a new match
 */
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;

    const userId = session!.user.id;

    // Parse request body
    const body = await request.json();
    const { player1Id, player2Id, player1Score, player2Score, isTournamentMatch, tournamentId } = body;

    // Validate required fields
    if (!player1Id || !player2Id || player1Score === undefined || player2Score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: player1Id, player2Id, player1Score, player2Score" },
        { status: 400 }
      );
    }

    // Validate players are different
    if (player1Id === player2Id) {
      return NextResponse.json(
        { error: "Player 1 and Player 2 must be different" },
        { status: 400 }
      );
    }

    // Validate scores
    if (player1Score < MIN_SCORE || player1Score > MAX_SCORE || 
        player2Score < MIN_SCORE || player2Score > MAX_SCORE) {
      return NextResponse.json(
        { error: `Scores must be between ${MIN_SCORE} and ${MAX_SCORE}` },
        { status: 400 }
      );
    }

    // Determine winner
    const winnerId = player1Score > player2Score ? player1Id : player2Id;

    // Fetch both players
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

    // Check if players are banned
    if (player1.isBanned || player2.isBanned) {
      return NextResponse.json(
        { error: "One or both players are banned and cannot play matches" },
        { status: 403 }
      );
    }

    // Calculate ELO changes
    const eloResult = calculateEloChange(
      player1.foreverElo,
      player2.foreverElo,
      player1.matchesPlayed,
      player2.matchesPlayed,
      {
        player1Score,
        player2Score,
        winnerId: winnerId === player1Id ? "player1" : "player2",
      },
      isTournamentMatch || false
    );

    // Get current season if exists
    const currentSeason = await prisma.season.findFirst({
      where: { isActive: true },
    });

    // Create match and update player ELOs in a transaction
    const match = await prisma.$transaction(async (tx) => {
      // Create the match
      const newMatch = await tx.match.create({
        data: {
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
        },
      });

      // Update player ELOs and match counts
      const player1NewElo = player1.foreverElo + eloResult.player1Change;
      const player2NewElo = player2.foreverElo + eloResult.player2Change;

      await tx.user.update({
        where: { id: player1Id },
        data: {
          foreverElo: player1NewElo,
          matchesPlayed: { increment: 1 },
        },
      });

      await tx.user.update({
        where: { id: player2Id },
        data: {
          foreverElo: player2NewElo,
          matchesPlayed: { increment: 1 },
        },
      });

      // If there's an active season, update season ELOs
      if (currentSeason) {
        const player1SeasonEloChange = isTournamentMatch 
          ? eloResult.player1Change 
          : Math.round(eloResult.player1Change * 0.9); // 90% to season, 10% to forever
        const player2SeasonEloChange = isTournamentMatch
          ? eloResult.player2Change
          : Math.round(eloResult.player2Change * 0.9);

        await tx.user.update({
          where: { id: player1Id },
          data: {
            seasonElo: player1.seasonElo + player1SeasonEloChange,
          },
        });

        await tx.user.update({
          where: { id: player2Id },
          data: {
            seasonElo: player2.seasonElo + player2SeasonEloChange,
          },
        });
      }

      return newMatch;
    });

    return NextResponse.json({
      match,
      eloChange: {
        player1: {
          before: eloResult.player1NewElo - eloResult.player1Change,
          after: eloResult.player1NewElo,
          change: eloResult.player1Change,
        },
        player2: {
          before: eloResult.player2NewElo - eloResult.player2Change,
          after: eloResult.player2NewElo,
          change: eloResult.player2Change,
        },
        explanation: eloResult.explanation,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json(
      { error: "Failed to create match" },
      { status: 500 }
    );
  }
}
