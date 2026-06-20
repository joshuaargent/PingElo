/**
 * Team Leave API Route
 * 
 * Rules:
 * - Cannot leave after playing a match this season
 * - Freshly created team (no matches this season): DELETE team entirely, free both players
 * - Reactivated past-season team (has matches from before): DEACTIVATE, free both players to create new
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;

    const { id } = await params;
    const userId = session!.user.id;
    const isAdmin = (session!.user as any).role === 'ADMIN';

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        seasonStats: {
          where: { season: { isActive: true } },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const isPlayer1 = team.player1Id === userId;
    const isPlayer2 = team.player2Id === userId;

    if (!isPlayer1 && !isPlayer2 && !isAdmin) {
      return NextResponse.json({ error: "You are not a member of this team" }, { status: 403 });
    }

    const currentSeasonStat = team.seasonStats[0];
    const matchesThisSeason = currentSeasonStat?.matchesPlayed || 0;

    // Cannot leave after playing a match this season
    if (matchesThisSeason > 0 && !isAdmin) {
      return NextResponse.json({
        error: "Cannot leave team after playing matches this season"
      }, { status: 400 });
    }

    // Freshly created this season (0 matches) = DELETE team entirely
    // Reactivated from past season = DEACTIVATE and let both create new
    
    if (matchesThisSeason === 0) {
      // Fresh team - delete it and free both players completely
      await prisma.team.delete({ where: { id } });
      
      return NextResponse.json({
        success: true,
        message: "Left team. Team deleted as it had no matches.",
        teamDeleted: true,
      });
    } else {
      // Past season team with matches - deactivate and free players
      await prisma.team.update({
        where: { id },
        data: { isActive: false },
      });
      
      // Delete season stats to free activation slots
      if (currentSeasonStat) {
        await prisma.teamSeasonStats.delete({ where: { id: currentSeasonStat.id } });
      }

      return NextResponse.json({
        success: true,
        message: "Left team. Team deactivated. Both players can now create new teams.",
        teamDeactivated: true,
      });
    }

  } catch (error) {
    console.error("Error leaving team:", error);
    return NextResponse.json({ error: "Failed to leave team" }, { status: 500 });
  }
}
