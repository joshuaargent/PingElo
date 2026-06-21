/**
 * User Achievements API
 * Get achievements for a specific user
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/achievements/user/[id]
 * Get all achievements for a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch user achievements
    const achievements = await prisma.achievement.findMany({
      where: {
        userId: id,
      },
      orderBy: {
        unlockedAt: 'desc',
      },
    });

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
  }
}
