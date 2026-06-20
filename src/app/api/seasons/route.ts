/**
 * Seasons API Route
 * Handles season listing and management
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionOrForbidden } from "@/lib/auth-actions";

/**
 * GET /api/seasons - List seasons
 */
export async function GET() {
  try {
    const [activeSeasons, pastSeasons] = await Promise.all([
      prisma.season.findMany({
        where: { isActive: true },
        include: {
          winner: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { startDate: "desc" },
      }),
      prisma.season.findMany({
        where: { isActive: false },
        include: {
          winner: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { endDate: "desc" },
        take: 12,
      }),
    ]);

    return NextResponse.json({
      activeSeasons,
      pastSeasons,
    });
  } catch (error) {
    console.error("Error fetching seasons:", error);
    return NextResponse.json(
      { error: "Failed to fetch seasons" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seasons - Create a new season (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { session, response: authResponse } = await getAdminSessionOrForbidden();
    if (authResponse) return authResponse;

    const body = await request.json();
    const { name, startDate, endDate } = body;

    // Validate required fields
    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Name, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (start >= end) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Check for overlapping seasons
    const overlapping = await prisma.season.findFirst({
      where: {
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } },
            ],
          },
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: "Season dates overlap with existing season" },
        { status: 400 }
      );
    }

    // Create season
    const season = await prisma.season.create({
      data: {
        name,
        startDate: start,
        endDate: end,
        isActive: true,
      },
      include: {
        winner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ season }, { status: 201 });
  } catch (error) {
    console.error("Error creating season:", error);
    return NextResponse.json(
      { error: "Failed to create season" },
      { status: 500 }
    );
  }
}
