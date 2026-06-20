/**
 * Season Reset API Route
 * Resets season ELO for all users
 * - Automatic trigger when season end date passes (no auth required)
 * - Manual trigger by admin (requires admin session)
 * Also resets all teams from the previous season
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionOrForbidden } from "@/lib/auth-actions";

export async function POST(request: NextRequest) {
  try {
    // Check if this is a cron/scheduled call (has secret) or admin session
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isCronCall = cronSecret && authHeader === `Bearer ${cronSecret}`;
    
    let isAdmin = false;
    
    // Check for admin session if not a cron call
    if (!isCronCall) {
      const { response: authResponse } = await getAdminSessionOrForbidden();
      if (authResponse) return authResponse;
      isAdmin = true;
    }

    // Check if there's an active season
    const currentSeason = await prisma.season.findFirst({
      where: { isActive: true },
    });

    if (!currentSeason) {
      return NextResponse.json(
        { error: "No active season found" },
        { status: 400 }
      );
    }

    // For non-cron calls, check if season has ended
    // Cron jobs can trigger even before end date (manual admin override)
    if (!isCronCall) {
      const now = new Date();
      const shouldReset = now > currentSeason.endDate;
      
      if (!shouldReset) {
        return NextResponse.json({
          message: "Season not ready for reset",
          currentSeason: {
            name: currentSeason.name,
            endDate: currentSeason.endDate,
          },
          daysRemaining: Math.ceil((currentSeason.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        });
      }
    }

    // Perform the reset
    const result = await prisma.$transaction(async (tx) => {
      // 1. End current season
      const currentSeason = await tx.season.findFirst({
        where: { isActive: true },
      });

      if (currentSeason) {
        await tx.season.update({
          where: { id: currentSeason.id },
          data: { isActive: false },
        });

        // Award bonus to season winner (singles)
        const winner = await tx.user.findFirst({
          where: { seasonElo: { gt: 0 } },
          orderBy: { seasonElo: "desc" },
        });

        if (winner) {
          // Find the winner's highest ever ELO
          const bonus = Math.round(winner.seasonElo * 0.1); // 10% bonus
          await tx.user.update({
            where: { id: winner.id },
            data: { foreverElo: { increment: bonus } },
          });
        }
        
        // Award bonus to doubles season winner
        const doublesWinner = await tx.user.findFirst({
          where: { doublesSeasonElo: { gt: 0 } },
          orderBy: { doublesSeasonElo: "desc" },
        });

        if (doublesWinner) {
          const bonus = Math.round(doublesWinner.doublesSeasonElo * 0.1); // 10% bonus
          await tx.user.update({
            where: { id: doublesWinner.id },
            data: { doublesForeverElo: { increment: bonus } },
          });
        }
        
        // 1b. Mark all active teams as inactive (preserved for history)
        // Teams persist but become inactive when season ends
        // Also reset team doublesSeasonElo to 1000
        await tx.team.updateMany({
          where: { isActive: true },
          data: { isActive: false, doublesSeasonElo: 1000 },
        });
      }

      // 2. Reset all users' season ELO to 1000
      await tx.user.updateMany({
        data: { seasonElo: 1000, doublesSeasonElo: 1000 },
      });

      // 3. Create new season (1 month duration)
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const seasonName = `Season ${startDate.toLocaleString("default", { month: "long" })} ${startDate.getFullYear()}`;

      const newSeason = await tx.season.create({
        data: {
          name: seasonName,
          startDate,
          endDate,
          isActive: true,
        },
      });

      return { newSeason, previousSeason: currentSeason };
    });

    return NextResponse.json({
      success: true,
      message: `Season reset complete. ${result.previousSeason?.name || "Previous season"} has ended. Your past teams are saved in history!`,
      newSeason: result.newSeason,
    });
  } catch (error) {
    console.error("Error resetting season:", error);
    return NextResponse.json(
      { error: "Failed to reset season" },
      { status: 500 }
    );
  }
}

// GET - Check current season status
export async function GET() {
  try {
    const currentSeason = await prisma.season.findFirst({
      where: { isActive: true },
    });

    if (!currentSeason) {
      return NextResponse.json({
        status: "no_active_season",
        message: "No active season",
      });
    }

    const now = new Date();
    const daysRemaining = Math.ceil((currentSeason.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      status: "active",
      season: {
        id: currentSeason.id,
        name: currentSeason.name,
        startDate: currentSeason.startDate,
        endDate: currentSeason.endDate,
        daysRemaining: Math.max(0, daysRemaining),
      },
    });
  } catch (error) {
    console.error("Error checking season:", error);
    return NextResponse.json(
      { error: "Failed to check season status" },
      { status: 500 }
    );
  }
}
