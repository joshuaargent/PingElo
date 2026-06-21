/**
 * Match Reactions API
 * Handle emoji reactions on matches
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

const VALID_EMOJIS = ['🔥', '💪', '👏', '😮', '😂', '🏆'];

/**
 * POST /api/matches/reactions
 * Add or remove a reaction on a match
 */
export async function POST(request: NextRequest) {
  try {
    const { session, response: authResponse } = await getSessionOrUnauthorized();
    if (authResponse) return authResponse;

    const userId = (session!.user as { id: string }).id;
    const body = await request.json();
    const { matchId, emoji } = body;

    if (!matchId || !emoji) {
      return NextResponse.json({ error: 'Missing matchId or emoji' }, { status: 400 });
    }

    if (!VALID_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
    }

    // Check if match exists
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check if user already reacted with this emoji
    const existing = await prisma.matchReaction.findUnique({
      where: {
        matchId_userId_emoji: {
          matchId,
          userId,
          emoji,
        },
      },
    });

    if (existing) {
      // Remove the reaction
      await prisma.matchReaction.delete({
        where: { id: existing.id },
      });

      // Get updated counts
      const counts = await prisma.matchReaction.groupBy({
        by: ['emoji'],
        where: { matchId },
        _count: { emoji: true },
      });

      return NextResponse.json({
        action: 'removed',
        emoji,
        counts: counts.reduce((acc, curr) => {
          acc[curr.emoji] = curr._count.emoji;
          return acc;
        }, {} as Record<string, number>),
      });
    } else {
      // Add the reaction
      await prisma.matchReaction.create({
        data: {
          matchId,
          userId,
          emoji,
        },
      });

      // Get updated counts
      const counts = await prisma.matchReaction.groupBy({
        by: ['emoji'],
        where: { matchId },
        _count: { emoji: true },
      });

      return NextResponse.json({
        action: 'added',
        emoji,
        counts: counts.reduce((acc, curr) => {
          acc[curr.emoji] = curr._count.emoji;
          return acc;
        }, {} as Record<string, number>),
      });
    }
  } catch (error) {
    console.error("Error handling reaction:", error);
    return NextResponse.json({ error: "Failed to handle reaction" }, { status: 500 });
  }
}

/**
 * GET /api/matches/reactions?matchId=xxx
 * Get reactions for a match
 */
export async function GET(request: NextRequest) {
  try {
    const { session, response: authResponse } = await getSessionOrUnauthorized();
    if (authResponse) {
      // Allow unauthenticated access, just return empty reactions
      return NextResponse.json({ reactions: {}, userReactions: [] });
    }

    const userId = (session!.user as { id: string }).id;
    const matchId = request.nextUrl.searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });
    }

    // Get all reactions for the match
    const reactions = await prisma.matchReaction.findMany({
      where: { matchId },
      select: { emoji: true, userId: true },
    });

    // Count by emoji
    const counts = reactions.reduce((acc, curr) => {
      acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get user's reactions
    const userReactions = reactions
      .filter(r => r.userId === userId)
      .map(r => r.emoji);

    return NextResponse.json({ counts, userReactions });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json({ error: "Failed to fetch reactions" }, { status: 500 });
  }
}
