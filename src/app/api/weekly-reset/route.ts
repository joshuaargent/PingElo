/**
 * Weekly Reset API Route
 * Awards 10% bonus to weekly leaders in each category (singles, doubles, teams)
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
      const bonusesAwarded = [];
      
      // 1. SINGLES - Top singles climber (3+ matches to qualify)
      const singlesLeaders = await tx.user.findMany({
        where: {
          weeklySinglesEloGained: { gt: 0 },
          weeklySinglesMatches: { gte: 3 },
        },
        orderBy: { weeklySinglesEloGained: "desc" },
        take: 1,
        select: {
          id: true,
          name: true,
          weeklySinglesEloGained: true,
          weeklySinglesMatches: true,
          foreverElo: true,
        },
      });

      const singlesLeader = singlesLeaders[0];
      if (singlesLeader && singlesLeader.weeklySinglesEloGained > 0) {
        const bonus = Math.round(singlesLeader.weeklySinglesEloGained * 0.1); // 10% bonus
        if (bonus > 0) {
          await tx.user.update({
            where: { id: singlesLeader.id },
            data: { foreverElo: { increment: bonus } },
          });

          await tx.eloHistory.create({
            data: {
              userId: singlesLeader.id,
              changeType: 'WEEKLY_BONUS',
              eloBefore: singlesLeader.foreverElo,
              eloAfter: singlesLeader.foreverElo + bonus,
              change: bonus,
              description: `Singles Top Climber weekly bonus (+${bonus} forever ELO)`,
              metadata: { 
                category: 'SINGLES',
                weeklyEloGained: singlesLeader.weeklySinglesEloGained,
                bonusPercentage: 10,
                matchesPlayed: singlesLeader.weeklySinglesMatches,
              },
            },
          });

          await tx.activity.create({
            data: {
              type: 'WEEKLY_TOP_CLIMBER',
              message: `🎯 Weekly Singles Top Climber! +${bonus} forever ELO`,
              userId: singlesLeader.id,
              metadata: { 
                bonus,
                weeklyEloGained: singlesLeader.weeklySinglesEloGained,
                category: 'SINGLES',
                rank: 1,
              },
            },
          });
          
          bonusesAwarded.push({ category: 'SINGLES', userId: singlesLeader.id, bonus });
        }
      }

      // 2. DOUBLES - Top doubles climber (3+ matches to qualify)
      const doublesLeaders = await tx.user.findMany({
        where: {
          weeklyDoublesEloGained: { gt: 0 },
          weeklyDoublesMatches: { gte: 3 },
        },
        orderBy: { weeklyDoublesEloGained: "desc" },
        take: 1,
        select: {
          id: true,
          name: true,
          weeklyDoublesEloGained: true,
          weeklyDoublesMatches: true,
          foreverElo: true,
        },
      });

      const doublesLeader = doublesLeaders[0];
      if (doublesLeader && doublesLeader.weeklyDoublesEloGained > 0) {
        const bonus = Math.round(doublesLeader.weeklyDoublesEloGained * 0.1); // 10% bonus
        if (bonus > 0) {
          await tx.user.update({
            where: { id: doublesLeader.id },
            data: { foreverElo: { increment: bonus } },
          });

          await tx.eloHistory.create({
            data: {
              userId: doublesLeader.id,
              changeType: 'WEEKLY_BONUS',
              eloBefore: doublesLeader.foreverElo,
              eloAfter: doublesLeader.foreverElo + bonus,
              change: bonus,
              description: `Doubles Top Climber weekly bonus (+${bonus} forever ELO)`,
              metadata: { 
                category: 'DOUBLES',
                weeklyEloGained: doublesLeader.weeklyDoublesEloGained,
                bonusPercentage: 10,
                matchesPlayed: doublesLeader.weeklyDoublesMatches,
              },
            },
          });

          await tx.activity.create({
            data: {
              type: 'WEEKLY_TOP_CLIMBER',
              message: `🎾 Weekly Doubles Top Climber! +${bonus} forever ELO`,
              userId: doublesLeader.id,
              metadata: { 
                bonus,
                weeklyEloGained: doublesLeader.weeklyDoublesEloGained,
                category: 'DOUBLES',
                rank: 1,
              },
            },
          });
          
          bonusesAwarded.push({ category: 'DOUBLES', userId: doublesLeader.id, bonus });
        }
      }

      // 3. TEAMS - Top team climber (3+ matches to qualify)
      const teamLeaders = await tx.user.findMany({
        where: {
          weeklyTeamEloGained: { gt: 0 },
          weeklyTeamMatches: { gte: 3 },
        },
        orderBy: { weeklyTeamEloGained: "desc" },
        take: 1,
        select: {
          id: true,
          name: true,
          weeklyTeamEloGained: true,
          weeklyTeamMatches: true,
          foreverElo: true,
        },
      });

      const teamLeader = teamLeaders[0];
      if (teamLeader && teamLeader.weeklyTeamEloGained > 0) {
        const bonus = Math.round(teamLeader.weeklyTeamEloGained * 0.1); // 10% bonus
        if (bonus > 0) {
          await tx.user.update({
            where: { id: teamLeader.id },
            data: { foreverElo: { increment: bonus } },
          });

          await tx.eloHistory.create({
            data: {
              userId: teamLeader.id,
              changeType: 'WEEKLY_BONUS',
              eloBefore: teamLeader.foreverElo,
              eloAfter: teamLeader.foreverElo + bonus,
              change: bonus,
              description: `Teams Top Climber weekly bonus (+${bonus} forever ELO)`,
              metadata: { 
                category: 'TEAMS',
                weeklyEloGained: teamLeader.weeklyTeamEloGained,
                bonusPercentage: 10,
                matchesPlayed: teamLeader.weeklyTeamMatches,
              },
            },
          });

          await tx.activity.create({
            data: {
              type: 'WEEKLY_TOP_CLIMBER',
              message: `👥 Weekly Teams Top Climber! +${bonus} forever ELO`,
              userId: teamLeader.id,
              metadata: { 
                bonus,
                weeklyEloGained: teamLeader.weeklyTeamEloGained,
                category: 'TEAMS',
                rank: 1,
              },
            },
          });
          
          bonusesAwarded.push({ category: 'TEAMS', userId: teamLeader.id, bonus });
        }
      }

      // Reset weekly stats after awarding bonuses (new week starts fresh)
      await tx.user.updateMany({
        data: {
          weeklySinglesEloGained: 0,
          weeklyDoublesEloGained: 0,
          weeklyTeamEloGained: 0,
          weeklySinglesMatches: 0,
          weeklyDoublesMatches: 0,
          weeklyTeamMatches: 0,
        },
      });

      return {
        singlesLeader: singlesLeader ? {
          id: singlesLeader.id,
          name: singlesLeader.name,
          weeklyEloGained: singlesLeader.weeklySinglesEloGained,
          bonusAwarded: Math.round(singlesLeader.weeklySinglesEloGained * 0.1),
        } : null,
        doublesLeader: doublesLeader ? {
          id: doublesLeader.id,
          name: doublesLeader.name,
          weeklyEloGained: doublesLeader.weeklyDoublesEloGained,
          bonusAwarded: Math.round(doublesLeader.weeklyDoublesEloGained * 0.1),
        } : null,
        teamLeader: teamLeader ? {
          id: teamLeader.id,
          name: teamLeader.name,
          weeklyEloGained: teamLeader.weeklyTeamEloGained,
          bonusAwarded: Math.round(teamLeader.weeklyTeamEloGained * 0.1),
        } : null,
        bonusesAwarded,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Weekly bonuses awarded! Each category's Top Climber received 10% of their weekly gains as forever ELO.`,
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
    const singlesLeaders = await prisma.user.findMany({
      where: {
        weeklySinglesMatches: { gte: 3 },
      },
      orderBy: { weeklySinglesEloGained: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        weeklySinglesEloGained: true,
        weeklySinglesMatches: true,
      },
    });

    const doublesLeaders = await prisma.user.findMany({
      where: {
        weeklyDoublesMatches: { gte: 3 },
      },
      orderBy: { weeklyDoublesEloGained: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        weeklyDoublesEloGained: true,
        weeklyDoublesMatches: true,
      },
    });

    const teamLeaders = await prisma.user.findMany({
      where: {
        weeklyTeamMatches: { gte: 3 },
      },
      orderBy: { weeklyTeamEloGained: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        weeklyTeamEloGained: true,
        weeklyTeamMatches: true,
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
      leaderboards: {
        singles: singlesLeaders,
        doubles: doublesLeaders,
        teams: teamLeaders,
      },
    });
  } catch (error) {
    console.error("Error checking weekly status:", error);
    return NextResponse.json(
      { error: "Failed to check weekly status" },
      { status: 500 }
    );
  }
}
