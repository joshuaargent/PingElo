/**
 * Weekly Reset API Route
 * Awards 2.5% bonus to weekly ELO leader and tracks stats
 * Smart detection: Automatically runs when week ends (Monday)
 * This is purely a reward system - no resets, just bonuses for active players
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionOrForbidden } from "@/lib/auth-actions";

export async function POST(request: NextRequest) {
  try {
    // Check if this is an admin call (secret or session)
    const authHeader = request.headers.get("authorization");
    const adminSecret = process.env.ADMIN_SET_SECRET;
    const isAuthorized = adminSecret && authHeader === `Bearer ${adminSecret}`;
    
    // If not authorized with secret, check for admin session
    if (!isAuthorized) {
      const { response: authResponse } = await getAdminSessionOrForbidden();
      if (authResponse) {
        return NextResponse.json(
          { error: "Unauthorized. Admin access required." },
          { status: 403 }
        );
      }
    }

    // Perform the weekly bonus distribution
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find the top ELO climber this week (must have 3+ matches to qualify)
      const weeklyLeaders = await tx.user.findMany({
        where: {
          weeklyEloGained: { gt: 0 },
          weeklyMatchesPlayed: { gte: 3 },
        },
        orderBy: { weeklyEloGained: "desc" },
        take: 3, // Top 3 leaders
        select: {
          id: true,
          name: true,
          weeklyEloGained: true,
          weeklyMatchesPlayed: true,
          foreverElo: true,
        },
      });

      const eloLeader = weeklyLeaders[0];
      const winsLeader = await tx.user.findFirst({
        where: {
          weeklyWins: { gt: 0 },
          weeklyMatchesPlayed: { gte: 3 },
        },
        orderBy: { weeklyWins: "desc" },
      });

      // 2. Award 2.5% bonus to ELO leader (no reset - just award bonus)
      if (eloLeader && eloLeader.weeklyEloGained > 0) {
        const bonus = Math.round(eloLeader.weeklyEloGained * 0.025); // 2.5% of weekly gains
        if (bonus > 0) {
          await tx.user.update({
            where: { id: eloLeader.id },
            data: { foreverElo: { increment: bonus } },
          });

          // Record in ELO history
          await tx.eloHistory.create({
            data: {
              userId: eloLeader.id,
              changeType: 'WEEKLY_BONUS',
              eloBefore: eloLeader.foreverElo,
              eloAfter: eloLeader.foreverElo + bonus,
              change: bonus,
              description: `Top Climber weekly bonus (${eloLeader.weeklyEloGained} ELO gained this week)`,
              metadata: { 
                weeklyEloGained: eloLeader.weeklyEloGained,
                bonusPercentage: 2.5,
                matchesPlayed: eloLeader.weeklyMatchesPlayed,
              },
            },
          });

          // Log activity
          await tx.activity.create({
            data: {
              type: 'WEEKLY_TOP_CLIMBER',
              message: `🏆 Weekly Top Climber! +${bonus} ELO bonus`,
              userId: eloLeader.id,
              metadata: { 
                bonus,
                weeklyEloGained: eloLeader.weeklyEloGained,
                rank: 1,
              },
            },
          });
        }
      }

      // 3. Log recognition for wins leader (if different from ELO leader)
      if (winsLeader && (!eloLeader || winsLeader.id !== eloLeader.id)) {
        // Log activity for wins leader (no ELO bonus, just recognition)
        await tx.activity.create({
          data: {
            type: 'WEEKLY_WINS_LEADER',
            message: `🔥 Weekly Wins Leader! ${winsLeader.weeklyWins} wins this week`,
            userId: winsLeader.id,
            metadata: { 
              weeklyWins: winsLeader.weeklyWins,
              rank: 1,
            },
          },
        });
      }

      return {
        eloLeader: eloLeader ? {
          id: eloLeader.id,
          name: eloLeader.name,
          weeklyEloGained: eloLeader.weeklyEloGained,
          bonusAwarded: Math.round(eloLeader.weeklyEloGained * 0.025),
        } : null,
        winsLeader: winsLeader ? {
          id: winsLeader.id,
          name: winsLeader.name,
          weeklyWins: winsLeader.weeklyWins,
        } : null,
        topClimbers: weeklyLeaders.map((u, i) => ({
          rank: i + 1,
          id: u.id,
          name: u.name,
          weeklyEloGained: u.weeklyEloGained,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      message: `Weekly bonus awarded! Top Climber received 2.5% of their weekly ELO gains.`,
      ...result,
    });
  } catch (error) {
    console.error("Error performing weekly reset:", error);
    return NextResponse.json(
      { error: "Failed to perform weekly reset" },
      { status: 500 }
    );
  }
}

// GET - Check current weekly status (for admin dashboard)
export async function GET() {
  try {
    const weeklyLeaders = await prisma.user.findMany({
      where: {
        weeklyMatchesPlayed: { gte: 3 },
      },
      orderBy: { weeklyEloGained: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        weeklyEloGained: true,
        weeklyMatchesPlayed: true,
        weeklyWins: true,
      },
    });

    const winsLeader = await prisma.user.findFirst({
      where: {
        weeklyWins: { gt: 0 },
        weeklyMatchesPlayed: { gte: 3 },
      },
      orderBy: { weeklyWins: "desc" },
      select: {
        id: true,
        name: true,
        weeklyWins: true,
        weeklyMatchesPlayed: true,
      },
    });

    // Calculate week dates
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    
    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);

    return NextResponse.json({
      weekStart: monday.toISOString(),
      weekEnd: nextMonday.toISOString(),
      daysRemaining: Math.ceil((nextMonday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      eloLeaderboard: weeklyLeaders,
      winsLeader,
    });
  } catch (error) {
    console.error("Error checking weekly status:", error);
    return NextResponse.json(
      { error: "Failed to check weekly status" },
      { status: 500 }
    );
  }
}
