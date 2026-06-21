/**
 * Challenges API
 * Handle player-to-player challenges
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

/**
 * GET /api/challenges - Get challenges for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { session, response: authResponse } = await getSessionOrUnauthorized();
    if (authResponse) return authResponse;

    const userId = (session!.user as { id: string }).id;
    const status = request.nextUrl.searchParams.get("status");

    const where: any = {
      OR: [
        { challengerId: userId },
        { challengedId: userId },
      ],
    };

    if (status) {
      where.status = status;
    }

    const challenges = await prisma.challenge.findMany({
      where: {
        OR: [
          { challengerId: userId },
          { challengedId: userId },
        ],
        ...(status ? { status: status as any } : {}),
      },
      include: {
        challenger: {
          select: { id: true, name: true, image: true, foreverElo: true },
        },
        challenged: {
          select: { id: true, name: true, image: true, foreverElo: true },
        },
        match: {
          select: { id: true, player1Score: true, player2Score: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 });
  }
}

/**
 * POST /api/challenges - Create a new challenge
 */
export async function POST(request: NextRequest) {
  try {
    const { session, response: authResponse } = await getSessionOrUnauthorized();
    if (authResponse) return authResponse;

    const challengerId = (session!.user as { id: string }).id;
    const body = await request.json();
    const { challengedId, stakeAmount = 0 } = body;

    if (!challengedId) {
      return NextResponse.json({ error: "Challenged user ID required" }, { status: 400 });
    }

    if (challengedId === challengerId) {
      return NextResponse.json({ error: "Cannot challenge yourself" }, { status: 400 });
    }

    // Check if challenged user exists
    const challenged = await prisma.user.findUnique({
      where: { id: challengedId },
    });

    if (!challenged) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for existing pending challenge
    const existing = await prisma.challenge.findFirst({
      where: {
        challengerId,
        challengedId,
        status: "PENDING",
        expiresAt: { gte: new Date() },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Pending challenge already exists" }, { status: 400 });
    }

    // Create challenge (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const challenge = await prisma.challenge.create({
      data: {
        challengerId,
        challengedId,
        stakeAmount,
        expiresAt,
      },
      include: {
        challenger: {
          select: { id: true, name: true, image: true },
        },
        challenged: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error) {
    console.error("Error creating challenge:", error);
    return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 });
  }
}
