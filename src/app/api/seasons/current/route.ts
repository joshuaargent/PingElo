/**
 * Current Season API Route
 * Returns current season status and auto-creates season if none exists
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let currentSeason = await prisma.season.findFirst({
      where: { isActive: true },
    });

    const now = new Date();

    // If no active season exists, create one (first season ever)
    if (!currentSeason) {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const seasonName = `Season ${startDate.toLocaleString("default", { month: "long" })} ${startDate.getFullYear()}`;

      currentSeason = await prisma.season.create({
        data: {
          name: seasonName,
          startDate,
          endDate,
          isActive: true,
        },
      });

      return NextResponse.json({
        hasActiveSeason: true,
        needsReset: false,
        seasonCreated: true,
        season: {
          id: currentSeason.id,
          name: currentSeason.name,
          startDate: currentSeason.startDate,
          endDate: currentSeason.endDate,
          isActive: currentSeason.isActive,
        },
        currentDate: now.toISOString(),
      });
    }

    // Check if season has ended and needs reset
    const needsReset = now > currentSeason.endDate;

    return NextResponse.json({
      hasActiveSeason: true,
      needsReset,
      season: {
        id: currentSeason.id,
        name: currentSeason.name,
        startDate: currentSeason.startDate,
        endDate: currentSeason.endDate,
        isActive: currentSeason.isActive,
      },
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
