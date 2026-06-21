/**
 * Achievement Check API
 * Checks and awards achievements based on current user stats
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";
import { checkAchievements, checkSpecialAchievements, getAchievementDef } from "@/lib/achievements";

/**
 * POST /api/achievements/check
 * Check and award new achievements for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const { session, response: authResponse } = await getSessionOrUnauthorized();
    if (authResponse) return authResponse;

    const userId = (session!.user as { id: string }).id;
    const body = await request.json().catch(() => ({}));

    // Get current user stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        matchesPlayed: true,
        wins: true,
        losses: true,
        currentStreak: true,
        longestStreak: true,
        foreverElo: true,
        doublesMatchesPlayed: true,
        totalSinglesSeasonWins: true,
        totalDoublesSeasonWins: true,
        totalTeamSeasonWins: true,
        achievements: {
          select: { slug: true }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get unlocked slugs
    const unlockedSlugs = new Set(user.achievements.map(a => a.slug));

    // Build context for achievement checks
    const ctx = {
      userId,
      matchesPlayed: user.matchesPlayed,
      wins: user.wins,
      losses: user.losses,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      foreverElo: user.foreverElo,
      doublesMatchesPlayed: user.doublesMatchesPlayed,
      totalSinglesSeasonWins: user.totalSinglesSeasonWins,
      totalDoublesSeasonWins: user.totalDoublesSeasonWins,
      totalTeamSeasonWins: user.totalTeamSeasonWins,
      opponentElo: body.opponentElo,
      scoreDifference: body.scoreDifference,
      matchDuration: body.matchDuration,
    };

    // Check for new achievements
    let newAchievements: string[] = [];
    
    // Regular achievements
    const shouldUnlock = checkAchievements(ctx);
    for (const slug of shouldUnlock) {
      if (!unlockedSlugs.has(slug)) {
        newAchievements.push(slug);
      }
    }

    // Special achievements (if match was won)
    if (body.matchWon) {
      const specialAchievements = checkSpecialAchievements(
        ctx,
        body.matchWon,
        body.wasDown5Points || false,
        body.wasShutout || false,
        body.durationUnder2Min || false
      );
      for (const slug of specialAchievements) {
        if (!unlockedSlugs.has(slug) && !newAchievements.includes(slug)) {
          newAchievements.push(slug);
        }
      }
    }

    // Award new achievements
    const awardedAchievements = [];
    for (const slug of newAchievements) {
      const def = getAchievementDef(slug);
      if (def) {
        await prisma.achievement.create({
          data: {
            slug: def.slug,
            name: def.name,
            desc: def.description,
            icon: def.icon,
            tier: def.tier,
            userId,
          },
        });
        awardedAchievements.push(def);
        
        // Log activity for achievement unlock (non-blocking)
        prisma.activity.create({
          data: {
            type: 'ACHIEVEMENT',
            message: `Unlocked ${def.name}!`,
            metadata: { achievementSlug: def.slug, achievementName: def.name },
            userId,
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      newAchievements: awardedAchievements,
      totalUnlocked: user.achievements.length + awardedAchievements.length,
    });
  } catch (error) {
    console.error("Error checking achievements:", error);
    return NextResponse.json({ error: "Failed to check achievements" }, { status: 500 });
  }
}

/**
 * GET /api/achievements/check
 * Get all achievements for the current user
 */
export async function GET() {
  try {
    const { session, response: authResponse } = await getSessionOrUnauthorized();
    if (authResponse) return authResponse;

    const userId = (session!.user as { id: string }).id;

    const achievements = await prisma.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: "desc" },
    });

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
  }
}
