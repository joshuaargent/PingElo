/**
 * Teams API Route
 * Manage doubles teams (seasonal - resets each season)
 * Rules:
 * - Each person can CREATE 1 team per season
 * - Each person can BE IN up to 2 teams per season
 * - No duplicate partnerships within a season
 * - Teams reset when season resets
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

// Constants
const MAX_TEAMS_PER_PERSON = 2;
const MAX_TEAMS_CREATED_PER_PERSON = 1;

// GET /api/teams - List user's teams for current season
export async function GET(request: NextRequest) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;
    
    const userId = session!.user.id;
    
    // Get current season
    const currentSeason = await prisma.season.findFirst({
      where: { isActive: true },
    });
    
    const teams = await prisma.team.findMany({
      where: {
        seasonId: currentSeason?.id,
        OR: [
          { player1Id: userId },
          { player2Id: userId },
        ],
      },
      include: {
        player1: {
          select: { id: true, name: true, image: true, doublesForeverElo: true },
        },
        player2: {
          select: { id: true, name: true, image: true, doublesForeverElo: true },
        },
        season: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Count teams created by user (as player1)
    const teamsCreated = teams.filter(t => t.player1Id === userId).length;
    
    return NextResponse.json({ 
      teams,
      currentSeason: currentSeason ? { id: currentSeason.id, name: currentSeason.name } : null,
      limits: {
        maxTeamsYouCanBeIn: MAX_TEAMS_PER_PERSON,
        maxTeamsYouCanCreate: MAX_TEAMS_CREATED_PER_PERSON,
        teamsCreatedByYou: teamsCreated,
        teamsYouAreIn: teams.length,
      }
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;
    
    const userId = session!.user.id;
    const body = await request.json();
    const { partnerId, name } = body;
    
    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID is required" }, { status: 400 });
    }
    
    if (partnerId === userId) {
      return NextResponse.json({ error: "You cannot team with yourself" }, { status: 400 });
    }
    
    // Get current season
    const currentSeason = await prisma.season.findFirst({
      where: { isActive: true },
    });
    
    if (!currentSeason) {
      return NextResponse.json({ error: "No active season. Teams are seasonal." }, { status: 400 });
    }
    
    // Check if partner exists
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
    });
    
    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }
    
    if (partner.isBanned) {
      return NextResponse.json({ error: "This player is banned" }, { status: 403 });
    }
    
    // Check if YOU have already created MAX_TEAMS_CREATED_PER_PERSON teams this season
    const yourTeamsCreated = await prisma.team.count({
      where: {
        seasonId: currentSeason.id,
        player1Id: userId,
      },
    });
    
    if (yourTeamsCreated >= MAX_TEAMS_CREATED_PER_PERSON) {
      return NextResponse.json({ 
        error: `You can only create ${MAX_TEAMS_CREATED_PER_PERSON} team(s) per season`,
        limit: MAX_TEAMS_CREATED_PER_PERSON,
      }, { status: 400 });
    }
    
    // Check if PARTNER is already in MAX_TEAMS_PER_PERSON teams this season
    const partnerTeams = await prisma.team.findMany({
      where: {
        seasonId: currentSeason.id,
        OR: [
          { player1Id: partnerId },
          { player2Id: partnerId },
        ],
      },
    });
    
    if (partnerTeams.length >= MAX_TEAMS_PER_PERSON) {
      return NextResponse.json({ 
        error: `${partner.name} is already in ${MAX_TEAMS_PER_PERSON} teams this season`,
        partnerTeamCount: partnerTeams.length,
      }, { status: 400 });
    }
    
    // Check if YOU are already in MAX_TEAMS_PER_PERSON teams this season
    const yourTeams = await prisma.team.findMany({
      where: {
        seasonId: currentSeason.id,
        OR: [
          { player1Id: userId },
          { player2Id: userId },
        ],
      },
    });
    
    if (yourTeams.length >= MAX_TEAMS_PER_PERSON) {
      return NextResponse.json({ 
        error: `You are already in ${MAX_TEAMS_PER_PERSON} teams this season`,
        yourTeamCount: yourTeams.length,
      }, { status: 400 });
    }
    
    // Check if this partnership already exists in this season
    const existingTeam = await prisma.team.findFirst({
      where: {
        seasonId: currentSeason.id,
        OR: [
          { player1Id: userId, player2Id: partnerId },
          { player1Id: partnerId, player2Id: userId },
        ],
      },
    });
    
    if (existingTeam) {
      return NextResponse.json({ 
        error: "You already have a team with this player this season",
        team: existingTeam 
      }, { status: 400 });
    }
    
    // Get both players' doubles ELO
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userElo = user?.doublesForeverElo || 1000;
    const partnerElo = partner.doublesForeverElo || 1000;
    const avgElo = Math.round((userElo + partnerElo) / 2);
    
    const team = await prisma.team.create({
      data: {
        name: name || null,
        player1Id: userId,
        player2Id: partnerId,
        seasonId: currentSeason.id,
        foreverElo: avgElo,
        seasonElo: avgElo,
      },
      include: {
        player1: {
          select: { id: true, name: true, image: true, doublesForeverElo: true },
        },
        player2: {
          select: { id: true, name: true, image: true, doublesForeverElo: true },
        },
        season: {
          select: { id: true, name: true },
        },
      },
    });
    
    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}
