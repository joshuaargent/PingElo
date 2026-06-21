/**
 * Weekly Activity API
 * Track and retrieve weekly activity stats
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

/**
 * Get start of current week (Monday)
 */
function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * GET /api/weekly-activity
 * Get current user's weekly activity stats
 */
export async function GET() {
  try {
    const { session, response: authResponse } = await getSessionOrUnauthorized();
    if (authResponse) return authResponse;

    const userId = (session!.user as { id: string }).id;
    const weekStart = getWeekStart();

    // Get or create this week's activity
    let activity = await prisma.weeklyActivity.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
    });

    // Create if doesn't exist
    if (!activity) {
      activity = await prisma.weeklyActivity.create({
        data: {
          userId,
          weekStart,
        },
      });
    }

    return NextResponse.json({ currentWeek: activity });
  } catch (error) {
    console.error("Error fetching weekly activity:", error);
    return NextResponse.json({ error: "Failed to fetch weekly activity" }, { status: 500 });
  }
}

/**
 * POST /api/weekly-activity
 * Update weekly activity stats (called after matches)
 */
export async function POST(request: Request) {
  try {
    const { session, response: authResponse } = await getSessionOrUnauthorized();
    if (authResponse) return authResponse;

    const userId = (session!.user as { id: string }).id;
    const body = await request.json();
    const { eloChange = 0, won = false } = body;

    const weekStart = getWeekStart();

    // Update or create this week's activity
    const activity = await prisma.weeklyActivity.upsert({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
      update: {
        matchesPlayed: { increment: 1 },
        wins: won ? { increment: 1 } : undefined,
        eloChange: { increment: eloChange },
        isQualified: { set: true }, // 1+ matches = qualified
      },
      create: {
        userId,
        weekStart,
        matchesPlayed: 1,
        wins: won ? 1 : 0,
        eloChange,
        isQualified: true,
      },
    });

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("Error updating weekly activity:", error);
    return NextResponse.json({ error: "Failed to update weekly activity" }, { status: 500 });
  }
}
