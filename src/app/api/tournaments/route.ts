/**
 * Tournaments API Route
 * Handles tournament creation and listing (singles and doubles)
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";
import { calculateEntryFee, TOURNAMENT_HOUSE_INJECTION } from "@/lib/elo";

// Validation constants
const MIN_PARTICIPANTS = 2;
const MAX_PARTICIPANTS = 64;
const MIN_SCORE = 3;
const MAX_SCORE = 21;

/**
 * GET /api/tournaments - List tournaments
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const creatorId = searchParams.get("creatorId");
    const matchType = searchParams.get("matchType"); // "SINGLES" or "DOUBLES"

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (creatorId) {
      where.creatorId = creatorId;
    }

    if (matchType) {
      where.matchType = matchType;
    }

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.tournament.count({ where }),
    ]);

    return NextResponse.json({
      tournaments: tournaments.map(t => ({
        ...t,
        participantCount: t._count.participants,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tournaments - Create a new tournament
 */
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;

    const userId = session!.user.id;

    const body = await request.json();
    const {
      name,
      description,
      matchType, // "SINGLES" or "DOUBLES"
      entryFee,
      prizePool,
      maxScore,
      format,
      maxParticipants,
      startsAt,
      status,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Tournament name is required" },
        { status: 400 }
      );
    }

    // Validate match type
    const finalMatchType = matchType === "DOUBLES" ? "DOUBLES" : "SINGLES";

    // For doubles, adjust max participants (need even numbers for pairs)
    let finalMaxParticipants = Math.min(
      Math.max(maxParticipants || 8, MIN_PARTICIPANTS),
      MAX_PARTICIPANTS
    );
    if (finalMatchType === "DOUBLES") {
      // For doubles, maxParticipants refers to number of teams
      // So we need 4 * teams players (but the db stores it as players)
      // Actually, let's keep it simple: maxParticipants for doubles = number of teams
      finalMaxParticipants = Math.min(Math.max(maxParticipants || 8, MIN_PARTICIPANTS), MAX_PARTICIPANTS / 2);
    }

    const finalMaxScore = Math.min(
      Math.max(maxScore || 21, MIN_SCORE),
      MAX_SCORE
    );

    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        name,
        description: description || null,
        matchType: finalMatchType,
        creatorId: userId,
        entryFee: entryFee || 0,
        prizePool: prizePool || TOURNAMENT_HOUSE_INJECTION,
        maxScore: finalMaxScore,
        format: format || "SINGLE_ELIMINATION",
        maxParticipants: finalMaxParticipants,
        startsAt: startsAt ? new Date(startsAt) : null,
        status: status || "DRAFT",
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ tournament }, { status: 201 });
  } catch (error) {
    console.error("Error creating tournament:", error);
    return NextResponse.json(
      { error: "Failed to create tournament" },
      { status: 500 }
    );
  }
}
