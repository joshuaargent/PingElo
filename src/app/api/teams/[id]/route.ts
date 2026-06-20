/**
 * Team by ID API Route
 * Get team details or delete team
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

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

// DELETE /api/teams/[id] - Delete a team
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
    
    // Only team members can delete
    if (team.player1Id !== userId && team.player2Id !== userId) {
      return NextResponse.json({ error: "Not authorized to delete this team" }, { status: 403 });
    }
    
    await prisma.team.delete({ where: { id } });
    
    return NextResponse.json({ success: true, message: "Team deleted" });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
