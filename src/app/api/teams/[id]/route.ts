/**
 * Team by ID API Route
 * Get team details, reactivate, or delete team (seasonal)
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
        season: {
          select: { id: true, name: true, isActive: true },
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

// POST /api/teams/[id]/reactivate - Reactivate a past team for current season
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;
    
    const { id } = await params;
    const userId = session!.user.id;
    
    // Get current season
    const currentSeason = await prisma.season.findFirst({
      where: { isActive: true },
    });
    
    if (!currentSeason) {
      return NextResponse.json({ error: "No active season" }, { status: 400 });
    }
    
    // Get the past team
    const pastTeam = await prisma.team.findUnique({
      where: { id },
      include: { season: true },
    });
    
    if (!pastTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    
    // Must be a past team
    if (pastTeam.season.isActive) {
      return NextResponse.json({ error: "Team is already active" }, { status: 400 });
    }
    
    // Must be a member of the team
    if (pastTeam.player1Id !== userId && pastTeam.player2Id !== userId) {
      return NextResponse.json({ error: "You are not a member of this team" }, { status: 403 });
    }
    
    // Check if this partnership already exists in current season
    const currentSeasonTeams = await prisma.team.findMany({
      where: {
        seasonId: currentSeason.id,
        isActive: true,
        OR: [
          { player1Id: pastTeam.player1Id, player2Id: pastTeam.player2Id },
          { player1Id: pastTeam.player2Id, player2Id: pastTeam.player1Id },
        ],
      },
    });
    
    if (currentSeasonTeams.length > 0) {
      return NextResponse.json({ error: "You already have this team active this season" }, { status: 400 });
    }
    
    // Check if either player has reached their team limit
    const player1CurrentTeams = await prisma.team.count({
      where: {
        seasonId: currentSeason.id,
        isActive: true,
        OR: [
          { player1Id: pastTeam.player1Id },
          { player2Id: pastTeam.player1Id },
        ],
      },
    });
    
    const player2CurrentTeams = await prisma.team.count({
      where: {
        seasonId: currentSeason.id,
        isActive: true,
        OR: [
          { player1Id: pastTeam.player2Id },
          { player2Id: pastTeam.player2Id },
        ],
      },
    });
    
    if (player1CurrentTeams >= MAX_TEAMS_PER_PERSON) {
      const player1 = await prisma.user.findUnique({ where: { id: pastTeam.player1Id } });
      return NextResponse.json({ 
        error: `${player1?.name || 'Player 1'} already has ${MAX_TEAMS_PER_PERSON} teams this season` 
      }, { status: 400 });
    }
    
    if (player2CurrentTeams >= MAX_TEAMS_PER_PERSON) {
      const player2 = await prisma.user.findUnique({ where: { id: pastTeam.player2Id } });
      return NextResponse.json({ 
        error: `${player2?.name || 'Player 2'} already has ${MAX_TEAMS_PER_PERSON} teams this season` 
      }, { status: 400 });
    }
    
    // Create a new team for current season, copying the name
    // The creator (player1) is whoever initiated the reactivation
    // But we keep the original team structure for stats
    const newTeam = await prisma.team.create({
      data: {
        name: pastTeam.name,
        player1Id: pastTeam.player1Id,
        player2Id: pastTeam.player2Id,
        seasonId: currentSeason.id,
        isActive: true,
        foreverElo: pastTeam.foreverElo,
        seasonElo: 1000, // Reset season ELO
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
      },
      include: {
        player1: { select: { id: true, name: true, image: true, doublesForeverElo: true } },
        player2: { select: { id: true, name: true, image: true, doublesForeverElo: true } },
        season: { select: { id: true, name: true, isActive: true } },
      },
    });
    
    return NextResponse.json({ 
      team: newTeam, 
      message: `Team ${pastTeam.name || 'reactivated'} for ${currentSeason.name}!`
    }, { status: 201 });
  } catch (error) {
    console.error("Error reactivating team:", error);
    return NextResponse.json({ error: "Failed to reactivate team" }, { status: 500 });
  }
}

// DELETE /api/teams/[id] - Delete a team (only if in current season)
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
      include: { season: true },
    });
    
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    
    // Only allow deletion of current season teams
    if (!team.season.isActive) {
      return NextResponse.json({ 
        error: "Cannot delete teams from past seasons" 
      }, { status: 400 });
    }
    
    // Only team creator (player1) can delete
    if (team.player1Id !== userId) {
      return NextResponse.json({ 
        error: "Only the team creator can delete this team" 
      }, { status: 403 });
    }
    
    await prisma.team.delete({ where: { id } });
    
    return NextResponse.json({ success: true, message: "Team deleted" });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
