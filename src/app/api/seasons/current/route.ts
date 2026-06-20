/**
 * Current Season API Route
 * Returns current season status and checks if reset is needed
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const currentSeason = await prisma.season.findFirst({
      where: { isActive: true },
    });

    const now = new Date();
    const needsReset = currentSeason && now > currentSeason.endDate;

    return NextResponse.json({
      hasActiveSeason: !!currentSeason,
      needsReset: !!needsReset,
      season: currentSeason ? {
        id: currentSeason.id,
        name: currentSeason.name,
        startDate: currentSeason.startDate,
        endDate: currentSeason.endDate,
        isActive: currentSeason.isActive,
      } : null,
      currentDate: now.toISOString(),
    });
  } catch (error) {
    console.error("Error checking season:", error);
    return NextResponse.json(
      { error: "Failed to check season status" },
      { status: 500 }
    );
  }
}
