/**
 * Team by ID API Route
 * Get team details, reactivate, update, or delete team
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

const MAX_TEAMS_PER_PERSON = 2;
const MAX_TEAMS_CREATED_PER_PERSON = 1;

// GET /api/teams/[id] - Get team details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        player1: {
          select: { id: true, name: true, image: true, doublesForeverElo: true },
        },
        player2: {
          select: { id: true, name: true, image: true, doublesForeverElo: true },
        },
        seasonStats: {
          include: {
            season: { select: { id: true, name: true, isActive: true } },
          },
          orderBy: { season: { startDate: 'desc' } },
        },
      },
    });
    
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    
    return NextResponse.json({ team });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

// PATCH /api/teams/[id] - Update team name or image
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;
    
    const { id } = await params;
    const userId = session!.user.id;
    const body = await request.json();
    const { name, image } = body;
    
    const team = await prisma.team.findUnique({
      where: { id },
    });
    
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    
    // Only team creator (player1) can update
    if (team.player1Id !== userId) {
      return NextResponse.json({ 
        error: "Only the team creator can update this team" 
      }, { status: 403 });
    }
    
    const updateData: Record<string, string | null> = {};
    if (name !== undefined) updateData.name = name || null;
    if (image !== undefined) updateData.image = image || null;
    
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        player1: {
          select: { id: true, name: true, image: true, doublesForeverElo: true },
        },
        player2: {
          select: { id: true, name: true, image: true, doublesForeverElo: true },
        },
        seasonStats: {
          include: {
            season: { select: { id: true, name: true, isActive: true } },
          },
          orderBy: { season: { startDate: 'desc' } },
        },
      },
    });
    
    return NextResponse.json({ team: updatedTeam });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}

// POST /api/teams/[id] - Reactivate a team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;
    
    const { id } = await params;
    const userId = session!.user.id;
    
    // Get current season - auto-create if none exists
    let currentSeason = await prisma.season.findFirst({
      where: { isActive: true },
    });
    
    if (!currentSeason) {
      const now = new Date();
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
    }
    
    // Get the team
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        seasonStats: {
          include: { season: true },
          orderBy: { season: { startDate: 'desc' } },
        },
      },
    });
    
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    
    // Check if user is part of this team
    if (team.player1Id !== userId && team.player2Id !== userId) {
      return NextResponse.json({ error: "You are not a member of this team" }, { status: 403 });
    }
    
    // Check if already active
    if (team.isActive) {
      return NextResponse.json({ error: "Team is already active" }, { status: 400 });
    }
    
    // Check if already has stats for current season
    const hasCurrentSeason = team.seasonStats.some(s => s.seasonId === currentSeason.id);
    if (hasCurrentSeason) {
      return NextResponse.json({ error: "Team already has stats for this season" }, { status: 400 });
    }
    
    // Reactivation counts toward YOUR activation limit
    const teamsActivatedByYou = await prisma.teamSeasonStats.count({
      where: {
        activatedById: userId,
        seasonId: currentSeason.id,
      },
    });
    
    if (teamsActivatedByYou >= MAX_TEAMS_CREATED_PER_PERSON) {
      return NextResponse.json({
        error: `You can only create or reactivate ${MAX_TEAMS_CREATED_PER_PERSON} team(s) per season`,
      }, { status: 400 });
    }
    
    // Check if reactivating would exceed the 2-team limit for either player
    const player1ActiveTeams = await prisma.team.count({
      where: {
        isActive: true,
        OR: [
          { player1Id: team.player1Id },
          { player2Id: team.player1Id },
        ],
      },
    });
    
    const player2ActiveTeams = team.player2Id ? await prisma.team.count({
      where: {
        isActive: true,
        OR: [
          { player1Id: team.player2Id },
          { player2Id: team.player2Id },
        ],
      },
    }) : 0;
    
    if (player1ActiveTeams >= MAX_TEAMS_PER_PERSON) {
      const player1 = await prisma.user.findUnique({ where: { id: team.player1Id } });
      return NextResponse.json({ 
        error: `${player1?.name || 'Player'} already has ${MAX_TEAMS_PER_PERSON} teams` 
      }, { status: 400 });
    }
    
    if (player2ActiveTeams >= MAX_TEAMS_PER_PERSON) {
      const player2 = team.player2Id ? await prisma.user.findUnique({ where: { id: team.player2Id } }) : null;
      return NextResponse.json({ 
        error: `${player2?.name || 'Player'} already has ${MAX_TEAMS_PER_PERSON} teams` 
      }, { status: 400 });
    }
    
    // Reactivate the team
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: { isActive: true },
    });
    
    // Create season stats for current season, tracking who activated
    await prisma.teamSeasonStats.create({
      data: {
        teamId: id,
        seasonId: currentSeason.id,
        activatedById: userId,
        seasonElo: team.foreverElo,
      },
    });
    
    // Fetch full team with relations
    const fullTeam = await prisma.team.findUnique({
      where: { id },
      include: {
        player1: {
          select: { id: true, name: true, image: true, doublesForeverElo: true },
        },
        player2: {
          select: { id: true, name: true, image: true, doublesForeverElo: true },
        },
        seasonStats: {
          include: {
            season: { select: { id: true, name: true, isActive: true } },
          },
          orderBy: { season: { startDate: 'desc' } },
        },
      },
    });
    
    return NextResponse.json({ 
      team: fullTeam, 
      message: `${team.name || 'Team'} reactivated for ${currentSeason.name}!`,
      reactivated: true,
    }, { status: 200 });
  } catch (error) {
    console.error("Error reactivating team:", error);
    return NextResponse.json({ error: "Failed to reactivate team" }, { status: 500 });
  }
}

// DELETE /api/teams/[id] - Delete or deactivate a team
// If team has never played (no matches), permanently delete it
// If team has played, just mark as inactive (preserve history)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;

    const { id } = await params;
    const userId = session!.user.id;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tournamentParticipants: true }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Only team creator (player1) can delete/deactivate
    if (team.player1Id !== userId) {
      return NextResponse.json({
        error: "Only the team creator can delete this team"
      }, { status: 403 });
    }

    // If team has never played any matches and no tournament participation, permanently delete
    if (team.totalMatchesPlayed === 0 && team._count.tournamentParticipants === 0) {
      await prisma.team.delete({
        where: { id },
      });
      return NextResponse.json({ 
        success: true, 
        message: "Team permanently deleted",
        permanentlyDeleted: true 
      });
    }

    // Team has played or participated - just mark as inactive (preserve history)
    await prisma.team.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Team deactivated (history preserved)",
      permanentlyDeleted: false 
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
