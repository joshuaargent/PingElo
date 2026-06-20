/**
 * Teams API Route
 * Manage doubles teams (create, list, delete)
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

// GET /api/teams - List user's teams
export async function GET(request: NextRequest) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;
    
    const userId = session!.user.id;
    
    const teams = await prisma.team.findMany({
      where: {
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
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    return NextResponse.json({ teams });
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
    
    // Check if team already exists
    const existingTeam = await prisma.team.findFirst({
      where: {
        OR: [
          { player1Id: userId, player2Id: partnerId },
          { player1Id: partnerId, player2Id: userId },
        ],
      },
    });
    
    if (existingTeam) {
      return NextResponse.json({ error: "You already have a team with this player", team: existingTeam }, { status: 400 });
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
      },
    });
    
    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}
