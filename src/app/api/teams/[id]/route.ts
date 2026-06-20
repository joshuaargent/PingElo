/**
 * Team by ID API Route
 * Get team details, reactivate, update, or delete team
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

const MAX_TEAMS_PER_PERSON = 2;

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
      }).catch(() => null);
      
      if (!currentSeason) {
        return NextResponse.json({ error: "Failed to create season" }, { status: 500 });
      }
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
    
    // Check if either player has reached their team limit
    const player1ActiveTeams = await prisma.team.count({
      where: {
        isActive: true,
        OR: [
          { player1Id: team.player1Id },
          { player2Id: team.player1Id },
        ],
      },
    });
    
    const player2ActiveTeams = await prisma.team.count({
      where: {
        isActive: true,
        OR: [
          { player1Id: team.player2Id },
          { player2Id: team.player2Id },
        ],
      },
    });
    
    if (player1ActiveTeams >= MAX_TEAMS_PER_PERSON) {
      const player1 = await prisma.user.findUnique({ where: { id: team.player1Id } });
      return NextResponse.json({ 
        error: `${player1?.name || 'Player'} already has ${MAX_TEAMS_PER_PERSON} teams` 
      }, { status: 400 });
    }
    
    if (player2ActiveTeams >= MAX_TEAMS_PER_PERSON) {
      const player2 = await prisma.user.findUnique({ where: { id: team.player2Id } });
      return NextResponse.json({ 
        error: `${player2?.name || 'Player'} already has ${MAX_TEAMS_PER_PERSON} teams` 
      }, { status: 400 });
    }
    
    // Reactivate the team
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: { isActive: true },
    });
    
    // Create season stats for current season
    await prisma.teamSeasonStats.create({
      data: {
        teamId: id,
        seasonId: currentSeason.id,
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

// DELETE /api/teams/[id] - Deactivate a team (don't delete, just make inactive)
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
    });
    
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    
    // Only team creator (player1) can deactivate
    if (team.player1Id !== userId) {
      return NextResponse.json({ 
        error: "Only the team creator can deactivate this team" 
      }, { status: 403 });
    }
    
    // Just mark as inactive, don't delete (preserve history)
    await prisma.team.update({
      where: { id },
      data: { isActive: false },
    });
    
    return NextResponse.json({ success: true, message: "Team deactivated" });
  } catch (error) {
    console.error("Error deactivating team:", error);
    return NextResponse.json({ error: "Failed to deactivate team" }, { status: 500 });
  }
}
