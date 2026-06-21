/**
 * Challenge Actions API
 * Accept, decline, or cancel challenges
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

/**
 * GET /api/challenges/[id] - Get a specific challenge
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response: authResponse } = await getSessionOrUnauthorized();
    if (authResponse) return authResponse;

    const userId = (session!.user as { id: string }).id;
    const { id } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        challenger: {
          select: { id: true, name: true, image: true, foreverElo: true },
        },
        challenged: {
          select: { id: true, name: true, image: true, foreverElo: true },
        },
        match: true,
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Only participants can view
    if (challenge.challengerId !== userId && challenge.challengedId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error("Error fetching challenge:", error);
    return NextResponse.json({ error: "Failed to fetch challenge" }, { status: 500 });
  }
}

/**
 * PATCH /api/challenges/[id] - Accept, decline, or cancel challenge
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response: authResponse } = await getSessionOrUnauthorized();
    if (authResponse) return authResponse;

    const userId = (session!.user as { id: string }).id;
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Handle different actions
    switch (action) {
      case "accept": {
        // Only challenged can accept
        if (challenge.challengedId !== userId) {
          return NextResponse.json({ error: "Only challenged player can accept" }, { status: 403 });
        }
        if (challenge.status !== "PENDING") {
          return NextResponse.json({ error: "Challenge is not pending" }, { status: 400 });
        }
        if (new Date() > challenge.expiresAt) {
          return NextResponse.json({ error: "Challenge has expired" }, { status: 400 });
        }

        const updated = await prisma.challenge.update({
          where: { id },
          data: { status: "ACCEPTED" },
          include: {
            challenger: { select: { id: true, name: true } },
            challenged: { select: { id: true, name: true } },
          },
        });
        return NextResponse.json({ challenge: updated });
      }

      case "decline": {
        // Only challenged can decline
        if (challenge.challengedId !== userId) {
          return NextResponse.json({ error: "Only challenged player can decline" }, { status: 403 });
        }
        if (challenge.status !== "PENDING") {
          return NextResponse.json({ error: "Challenge is not pending" }, { status: 400 });
        }

        const updated = await prisma.challenge.update({
          where: { id },
          data: { status: "DECLINED" },
          include: {
            challenger: { select: { id: true, name: true } },
            challenged: { select: { id: true, name: true } },
          },
        });
        return NextResponse.json({ challenge: updated });
      }

      case "cancel": {
        // Only challenger can cancel
        if (challenge.challengerId !== userId) {
          return NextResponse.json({ error: "Only challenger can cancel" }, { status: 403 });
        }
        if (challenge.status !== "PENDING" && challenge.status !== "ACCEPTED") {
          return NextResponse.json({ error: "Challenge cannot be cancelled" }, { status: 400 });
        }

        const updated = await prisma.challenge.update({
          where: { id },
          data: { status: "CANCELLED" },
          include: {
            challenger: { select: { id: true, name: true } },
            challenged: { select: { id: true, name: true } },
          },
        });
        return NextResponse.json({ challenge: updated });
      }

      case "complete": {
        // Only participants can mark complete
        if (challenge.challengerId !== userId && challenge.challengedId !== userId) {
          return NextResponse.json({ error: "Only participants can complete challenge" }, { status: 403 });
        }
        if (challenge.status !== "ACCEPTED") {
          return NextResponse.json({ error: "Challenge must be accepted first" }, { status: 400 });
        }

        const updated = await prisma.challenge.update({
          where: { id },
          data: { status: "COMPLETED" },
          include: {
            challenger: { select: { id: true, name: true } },
            challenged: { select: { id: true, name: true } },
            match: true,
          },
        });
        return NextResponse.json({ challenge: updated });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating challenge:", error);
    return NextResponse.json({ error: "Failed to update challenge" }, { status: 500 });
  }
}
