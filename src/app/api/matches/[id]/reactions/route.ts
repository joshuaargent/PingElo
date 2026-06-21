/**
 * Match Reactions API
 * Allows users to react to matches with emoji reactions
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

const VALID_REACTIONS = ['🔥', '👏', '😎', '💪', '🎉', '😂', '🤔', '👀'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;

    // Get all reactions for this match, grouped by emoji
    const reactions = await prisma.matchReaction.groupBy({
      by: ['emoji'],
      where: { matchId },
      _count: { emoji: true },
    });

    // Get user's own reaction if logged in
    const { session, response: authResponse } = await getSessionOrUnauthorized();
    let userReaction = null;
    
    if (!authResponse && session) {
      const existing = await prisma.matchReaction.findFirst({
        where: {
          matchId,
          userId: (session.user as { id: string }).id,
        },
        select: { emoji: true },
      });
      userReaction = existing?.emoji || null;
    }

    return NextResponse.json({
      reactions: reactions.map(r => ({
        emoji: r.emoji,
        count: r._count.emoji,
      })),
      userReaction,
    });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch reactions" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response: authResponse } = await getSessionOrUnauthorized();
    if (authResponse) return authResponse;

    const userId = (session!.user as { id: string }).id;
    const { id: matchId } = await params;
    const body = await request.json();
    const { emoji, action } = body;

    // Validate emoji
    if (!VALID_REACTIONS.includes(emoji)) {
      return NextResponse.json(
        { error: "Invalid reaction emoji" },
        { status: 400 }
      );
    }

    // Verify match exists
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    if (action === 'remove') {
      // Remove user's reaction
      await prisma.matchReaction.deleteMany({
        where: { matchId, userId },
      });

      return NextResponse.json({ success: true, action: 'removed' });
    }

    // Remove existing reaction first
    await prisma.matchReaction.deleteMany({
      where: { matchId, userId },
    });

    // Add new reaction
    const reaction = await prisma.matchReaction.create({
      data: {
        matchId,
        userId,
        emoji,
      },
    });

    return NextResponse.json({ success: true, reaction, action: 'added' });
  } catch (error) {
    console.error("Error adding reaction:", error);
    return NextResponse.json(
      { error: "Failed to add reaction" },
      { status: 500 }
    );
  }
}
