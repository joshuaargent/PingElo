/**
 * Tournament Detail API Route
 * Handles single tournament retrieval and operations (singles and doubles)
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized, getAdminSessionOrForbidden } from "@/lib/auth-actions";

// Validation constants
const MIN_SCORE = 3;
const MAX_SCORE = 21;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_PARTICIPANTS = 64;
const MIN_PARTICIPANTS = 2;

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
 * GET /api/tournaments/[id] - Get tournament details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                foreverElo: true,
                doublesForeverElo: true,
              },
            },
            team: {
              include: {
                player1: {
                  select: { id: true, name: true, image: true },
                },
                player2: {
                  select: { id: true, name: true, image: true },
                },
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        matches: {
          where: { deletedAt: null },
          include: {
            player1: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            player2: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            team1Player1: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            team1Player2: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            team2Player1: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            team2Player2: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        brackets: {
          orderBy: [
            { round: 'asc' },
            { position: 'asc' },
          ],
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ tournament });
  } catch (error) {
    console.error("Error fetching tournament:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tournaments/[id] - Update tournament
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;

    const { id } = await params;
    const body = await request.json();

    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const userRole = (session!.user as { role?: string }).role;
    const isAdmin = userRole === "ADMIN";
    const isCreator = tournament.creatorId === (session!.user as { id: string }).id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: "Only tournament creator or admin can update tournament" },
        { status: 403 }
      );
    }

    if (tournament.status === "COMPLETED" || tournament.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot update completed or cancelled tournaments" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // Validate and sanitize name
    if (body.name !== undefined) {
      const sanitizedName = sanitizeString(String(body.name));
      if (sanitizedName.length > MAX_NAME_LENGTH) {
        return NextResponse.json(
          { error: `Name must be ${MAX_NAME_LENGTH} characters or less` },
          { status: 400 }
        );
      }
      updateData.name = sanitizedName;
    }

    // Validate and sanitize description
    if (body.description !== undefined) {
      const sanitizedDesc = body.description ? sanitizeString(String(body.description)) : null;
      if (sanitizedDesc && sanitizedDesc.length > MAX_DESCRIPTION_LENGTH) {
        return NextResponse.json(
          { error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less` },
          { status: 400 }
        );
      }
      updateData.description = sanitizedDesc;
    }

    // Validate maxScore
    if (body.maxScore !== undefined) {
      const maxScore = Number(body.maxScore);
      if (isNaN(maxScore) || maxScore < MIN_SCORE || maxScore > MAX_SCORE) {
        return NextResponse.json(
          { error: `Max score must be between ${MIN_SCORE} and ${MAX_SCORE}` },
          { status: 400 }
        );
      }
      updateData.maxScore = maxScore;
    }

    // Validate format
    if (body.format !== undefined) {
      if (!VALID_FORMATS.includes(body.format)) {
        return NextResponse.json(
          { error: `Invalid format. Must be one of: ${VALID_FORMATS.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.format = body.format;
    }

    // Validate maxParticipants
    if (body.maxParticipants !== undefined) {
      const maxParticipants = Number(body.maxParticipants);
      if (isNaN(maxParticipants) || maxParticipants < MIN_PARTICIPANTS || maxParticipants > MAX_PARTICIPANTS) {
        return NextResponse.json(
          { error: `Max participants must be between ${MIN_PARTICIPANTS} and ${MAX_PARTICIPANTS}` },
          { status: 400 }
        );
      }
      updateData.maxParticipants = maxParticipants;
    }

    // Validate startsAt
    if (body.startsAt !== undefined) {
      if (body.startsAt === null || body.startsAt === "") {
        updateData.startsAt = null;
      } else {
        const parsedDate = new Date(body.startsAt);
        if (isNaN(parsedDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid start date format" },
            { status: 400 }
          );
        }
        updateData.startsAt = parsedDate;
      }
    }

    if (body.status !== undefined) {
      const validTransitions: Record<string, string[]> = {
        DRAFT: ["REGISTRATION_OPEN", "CANCELLED"],
        REGISTRATION_OPEN: ["IN_PROGRESS", "CANCELLED"],
        IN_PROGRESS: ["COMPLETED", "CANCELLED"],
      };

      if (!validTransitions[tournament.status]?.includes(body.status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${tournament.status} to ${body.status}` },
          { status: 400 }
        );
      }

      updateData.status = body.status;
    }

    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json({
      tournament: {
        ...updatedTournament,
        participantCount: updatedTournament._count.participants,
        _count: undefined,
      },
    });
  } catch (error) {
    console.error("Error updating tournament:", error);
    return NextResponse.json(
      { error: "Failed to update tournament" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tournaments/[id] - Delete tournament (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response: authResponse } = await getAdminSessionOrForbidden();
    if (authResponse) return authResponse;

    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    if (tournament.status === "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Cannot delete in-progress tournaments. Cancel it instead." },
        { status: 400 }
      );
    }

    await prisma.tournament.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tournament:", error);
    return NextResponse.json(
      { error: "Failed to delete tournament" },
      { status: 500 }
    );
  }
}
