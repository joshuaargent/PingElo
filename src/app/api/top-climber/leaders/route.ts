/**
 * Top Climber Leaders API
 * Get weekly top climbers
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Get start of week (Monday)
 */
function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * GET /api/top-climber/leaders
 * Get this week's top climbers
 */
export async function GET() {
  try {
    const weekStart = getWeekStart();

    // Get all qualified users this week
    const weeklyActivities = await prisma.weeklyActivity.findMany({
      where: {
        weekStart,
        isQualified: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { eloChange: "desc" },
      take: 10,
    });

    if (weeklyActivities.length === 0) {
      return NextResponse.json({
        eloLeader: null,
        winsLeader: null,
        allClimbers: [],
      });
    }

    // Find ELO leader
    const eloLeader = weeklyActivities[0];

    // Find wins leader
    const sortedByWins = [...weeklyActivities].sort((a, b) => b.wins - a.wins);
    const winsLeader = sortedByWins[0];

    return NextResponse.json({
      eloLeader: eloLeader ? {
        userId: eloLeader.user.id,
        name: eloLeader.user.name,
        image: eloLeader.user.image,
        eloGained: eloLeader.eloChange,
        wins: eloLeader.wins,
      } : null,
      winsLeader: winsLeader ? {
        userId: winsLeader.user.id,
        name: winsLeader.user.name,
        image: winsLeader.user.image,
        eloGained: winsLeader.eloChange,
        wins: winsLeader.wins,
      } : null,
      allClimbers: weeklyActivities.map(w => ({
        userId: w.user.id,
        name: w.user.name,
        image: w.user.image,
        eloGained: w.eloChange,
        wins: w.wins,
      })),
    });
  } catch (error) {
    console.error("Error fetching top climbers:", error);
    return NextResponse.json({ error: "Failed to fetch top climbers" }, { status: 500 });
  }
}
