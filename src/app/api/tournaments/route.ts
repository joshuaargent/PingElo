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
const MAX_ENTRY_FEE = 10000;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;

// Valid tournament formats
const VALID_FORMATS = ["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "ROUND_ROBIN", "SWISS"];

// Sanitize string input to prevent XSS
function sanitizeString(str: string): string {
  if (typeof str !== "string") return str;
  return str
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .trim();
}

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
          participants: {
            select: {
              id: true,
              userId: true,
              teamId: true,
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

    // Sanitize string inputs to prevent XSS
    const sanitizedName = sanitizeString(String(name));
    const sanitizedDescription = description ? sanitizeString(String(description)) : null;

    // Validate name length
    if (sanitizedName.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Tournament name must be ${MAX_NAME_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Validate description length
    if (sanitizedDescription && sanitizedDescription.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `Tournament description must be ${MAX_DESCRIPTION_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Validate match type
    const finalMatchType = matchType === "DOUBLES" ? "DOUBLES" : "SINGLES";

    // Validate entry fee (must be non-negative and within limits)
    const validatedEntryFee = Math.max(0, Math.min(Number(entryFee) || 0, MAX_ENTRY_FEE));

    // Validate prize pool (must be non-negative)
    const validatedPrizePool = Math.max(0, Number(prizePool) || 0);

    // Validate format against allowed values
    const validatedFormat = VALID_FORMATS.includes(format) ? format : "SINGLE_ELIMINATION";

    // For doubles, adjust max participants (need even numbers for pairs)
    let finalMaxParticipants = Math.min(
      Math.max(maxParticipants || 8, MIN_PARTICIPANTS),
      MAX_PARTICIPANTS
    );
    if (finalMatchType === "DOUBLES") {
      // For doubles, maxParticipants refers to number of teams
      finalMaxParticipants = Math.min(Math.max(maxParticipants || 8, MIN_PARTICIPANTS), MAX_PARTICIPANTS / 2);
    }

    // Validate max score (must be between MIN_SCORE and MAX_SCORE)
    const validatedMaxScore = Math.min(
      Math.max(maxScore || 21, MIN_SCORE),
      MAX_SCORE
    );

    // Validate status if provided (only allow DRAFT or REGISTRATION_OPEN for creation)
    const validatedStatus = (status === "DRAFT" || status === "REGISTRATION_OPEN") 
      ? status 
      : "DRAFT";

    // Validate startsAt if provided (must be a valid future date)
    let validatedStartsAt: Date | null = null;
    if (startsAt) {
      const parsedDate = new Date(startsAt);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid start date format" },
          { status: 400 }
        );
      }
      validatedStartsAt = parsedDate;
    }

    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        name: sanitizedName,
        description: sanitizedDescription,
        matchType: finalMatchType,
        creatorId: userId,
        entryFee: validatedEntryFee,
        prizePool: validatedPrizePool,
        maxScore: validatedMaxScore,
        format: validatedFormat,
        maxParticipants: finalMaxParticipants,
        startsAt: validatedStartsAt,
        status: validatedStatus,
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
