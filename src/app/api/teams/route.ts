/**
 * Teams API Route
 * Manage doubles teams
 * Rules:
 * - Each person can CREATE 1 team (as player1)
 * - Each person can BE IN up to 2 teams per season
 * - No duplicate partnerships within a season (same players = same team)
 * - Can create new team with same partner in different seasons
 * - Stats tracked per season via TeamSeasonStats
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

// Constants
const MAX_TEAMS_PER_PERSON = 2;
const MAX_TEAMS_CREATED_PER_PERSON = 1;

// GET /api/teams - List user's teams
// ?history=true - all teams including inactive
// default - only active teams
export async function GET(request: NextRequest) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;
    
    const userId = session!.user.id;
    const searchParams = request.nextUrl.searchParams;
    const includeHistory = searchParams.get('history') === 'true';
    const seasonId = searchParams.get('seasonId');
    
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
    
    // Build where clause for teams
    const teamWhere: Record<string, unknown> = {
      OR: [
        { player1Id: userId },
        { player2Id: userId },
      ],
    };
    
    if (!includeHistory) {
      teamWhere.isActive = true;
    }
    
    // Fetch teams with their season stats
    const teams = await prisma.team.findMany({
      where: teamWhere,
      include: {
        player1: {
          select: { id: true, name: true, image: true, doublesForeverElo: true },
        },
        player2: {
          select: { id: true, name: true, image: true, doublesForeverElo: true },
        },
        seasonStats: {
          include: {
            season: {
              select: { id: true, name: true, isActive: true },
            },
          },
          orderBy: { season: { startDate: 'desc' } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Filter by season if specified
    let filteredTeams = teams;
    if (seasonId) {
      filteredTeams = teams.filter(t => 
        t.seasonStats.some(s => s.seasonId === seasonId)
      );
    }
    
    // Count active teams for limits
    const activeTeams = teams.filter(t => t.isActive);
    const teamsCreated = activeTeams.filter(t => t.player1Id === userId).length;
    
    // Calculate total stats
    const totalWins = teams.reduce((sum, t) => sum + t.totalWins, 0);
    const totalLosses = teams.reduce((sum, t) => sum + t.totalLosses, 0);
    const totalMatches = teams.reduce((sum, t) => sum + t.totalMatchesPlayed, 0);
    const bestWinRate = teams.length > 0 
      ? Math.max(...teams.map(t => {
          const total = t.totalWins + t.totalLosses;
          return total > 0 ? Math.round((t.totalWins / total) * 100) : 0;
        }))
      : 0;
    
    return NextResponse.json({ 
      teams: filteredTeams,
      currentSeason: currentSeason ? { id: currentSeason.id, name: currentSeason.name } : null,
      limits: {
        maxTeamsYouCanBeIn: MAX_TEAMS_PER_PERSON,
        maxTeamsYouCanCreate: MAX_TEAMS_CREATED_PER_PERSON,
        teamsCreatedByYou: teamsCreated,
        teamsYouAreIn: activeTeams.length,
      },
      stats: {
        totalTeams: teams.length,
        totalWins,
        totalLosses,
        totalMatches,
        overallWinRate: totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0,
        bestWinRate,
        seasonsParticipated: new Set(teams.flatMap(t => t.seasonStats.map(s => s.seasonId))).size,
      }
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

// POST /api/teams - Create a new team OR reactivate existing
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;
    
    const userId = session!.user.id;
    const body = await request.json();
    const { partnerId, name, teamId } = body; // teamId for reactivation
    
    if (!partnerId && !teamId) {
      return NextResponse.json({ error: "Partner ID or Team ID is required" }, { status: 400 });
    }
    
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
    
    // If teamId provided, we're reactivating
    if (teamId) {
      const existingTeam = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          seasonStats: {
            include: { season: true },
            orderBy: { season: { startDate: 'desc' } },
          },
        },
      });
      
      if (!existingTeam) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }
      
      // Check if user is part of this team
      if (existingTeam.player1Id !== userId && existingTeam.player2Id !== userId) {
        return NextResponse.json({ error: "You are not part of this team" }, { status: 403 });
      }
      
      // Check if already active
      if (existingTeam.isActive) {
        return NextResponse.json({ error: "Team is already active" }, { status: 400 });
      }
      
      // Check if already has stats for current season
      const hasCurrentSeason = existingTeam.seasonStats.some(s => s.seasonId === currentSeason.id);
      if (hasCurrentSeason) {
        return NextResponse.json({ error: "Team already has stats for this season" }, { status: 400 });
      }
      
      // Reactivation counts toward YOUR activation limit (the person who reactivates)
      // Check how many teams YOU have activated this season
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
            { player1Id: existingTeam.player1Id },
            { player2Id: existingTeam.player1Id },
          ],
        },
      });
      
      const player2ActiveTeams = existingTeam.player2Id ? await prisma.team.count({
        where: {
          isActive: true,
          OR: [
            { player1Id: existingTeam.player2Id },
            { player2Id: existingTeam.player2Id },
          ],
        },
      }) : 0;
      
      if (player1ActiveTeams >= MAX_TEAMS_PER_PERSON) {
        const player1 = await prisma.user.findUnique({ where: { id: existingTeam.player1Id } });
        return NextResponse.json({
          error: `${player1?.name || 'Player'} already has ${MAX_TEAMS_PER_PERSON} teams`,
        }, { status: 400 });
      }
      
      if (player2ActiveTeams >= MAX_TEAMS_PER_PERSON) {
        const player2 = existingTeam.player2Id ? await prisma.user.findUnique({ where: { id: existingTeam.player2Id } }) : null;
        return NextResponse.json({
          error: `${player2?.name || 'Player'} already has ${MAX_TEAMS_PER_PERSON} teams`,
        }, { status: 400 });
      }
      
      // Reactivate the team and create new season stats
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: { isActive: true },
      });
      
      // Create season stats for current season, tracking who activated
      await prisma.teamSeasonStats.create({
        data: {
          teamId: teamId,
          seasonId: currentSeason.id,
          activatedById: userId,
          seasonElo: updatedTeam.foreverElo,
        },
      });
      
      return NextResponse.json({ 
        team: updatedTeam, 
        message: `${existingTeam.name || 'Team'} reactivated for ${currentSeason.name}!`,
        reactivated: true,
      }, { status: 200 });
    }
    
    // Creating new team
    if (partnerId === userId) {
      return NextResponse.json({ error: "You cannot team with yourself" }, { status: 400 });
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
    
    // Check if user already has a team with this partner in current season
    const existingTeamThisSeason = await prisma.team.findFirst({
      where: {
        OR: [
          { player1Id: userId, player2Id: partnerId },
          { player1Id: partnerId, player2Id: userId },
        ],
        seasonStats: {
          some: { seasonId: currentSeason.id },
        },
      },
    });
    
    if (existingTeamThisSeason) {
      return NextResponse.json({ 
        error: "You already have a team with this player this season",
        team: existingTeamThisSeason,
      }, { status: 400 });
    }
    
    // Check if YOU have already created MAX_TEAMS_CREATED_PER_PERSON teams
    const yourTeamsCreated = await prisma.team.count({
      where: { player1Id: userId },
    });
    
    if (yourTeamsCreated >= MAX_TEAMS_CREATED_PER_PERSON) {
      return NextResponse.json({ 
        error: `You can only create ${MAX_TEAMS_CREATED_PER_PERSON} team(s)`,
        limit: MAX_TEAMS_CREATED_PER_PERSON,
      }, { status: 400 });
    }
    
    // Check if YOU are already in MAX_TEAMS_PER_PERSON active teams
    const yourActiveTeams = await prisma.team.count({
      where: {
        isActive: true,
        OR: [
          { player1Id: userId },
          { player2Id: userId },
        ],
      },
    });
    
    if (yourActiveTeams >= MAX_TEAMS_PER_PERSON) {
      return NextResponse.json({ 
        error: `You are already in ${MAX_TEAMS_PER_PERSON} teams`,
        yourTeamCount: yourActiveTeams,
      }, { status: 400 });
    }
    
    // Get both players' doubles ELO
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userElo = user?.doublesForeverElo || 1000;
    const partnerElo = partner.doublesForeverElo || 1000;
    const avgElo = Math.round((userElo + partnerElo) / 2);
    
    // Create team with season stats in a transaction
    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name: name || null,
          player1Id: userId,
          player2Id: partnerId,
          foreverElo: avgElo,
          isActive: true,
          seasonStats: {
            create: {
              seasonId: currentSeason.id,
              activatedById: userId,
              seasonElo: avgElo,
            },
          },
        },
        include: {
          player1: {
            select: { id: true, name: true, image: true, doublesForeverElo: true },
          },
          player2: {
            select: { id: true, name: true, image: true, doublesForeverElo: true },
          },
          seasonStats: {
            include: {
              season: { select: { id: true, name: true } },
            },
          },
        },
      });
      return newTeam;
    });
    
    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}
