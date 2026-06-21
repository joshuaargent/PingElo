/**
 * Activity Feed API
 * Get and create activity feed entries
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

/**
 * GET /api/activity
 * Get recent activity feed (public)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const userId = searchParams.get("userId"); // Optional: filter by user
    const type = searchParams.get("type"); // Optional: filter by type

    const where: any = { isPublic: true };
    if (userId) where.userId = userId;
    if (type) where.type = type;

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 50),
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}

/**
 * POST /api/activity
 * Create a new activity (internal use, usually called by other APIs)
 */
export async function POST(request: NextRequest) {
  try {
    const { session, response: authResponse } = await getSessionOrUnauthorized();
    if (authResponse) return authResponse;

    const userId = (session!.user as { id: string }).id;
    const body = await request.json();
    const { type, message, metadata, matchId, isPublic = true } = body;

    if (!type || !message) {
      return NextResponse.json({ error: 'Missing type or message' }, { status: 400 });
    }

    const activity = await prisma.activity.create({
      data: {
        type,
        message,
        metadata: metadata || undefined,
        matchId: matchId || undefined,
        userId: userId,
        isPublic,
      },
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}
