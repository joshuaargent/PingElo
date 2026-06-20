/**
 * User Profile API Route
 * Handles single user retrieval and admin operations
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized, getAdminSessionOrForbidden } from "@/lib/auth-actions";
import { getKFactorLabel, getEloTierLabel, checkRustyStatus, calculatePercentile } from "@/lib/elo";

/**
 * GET /api/users/[id] - Get user profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        foreverElo: true,
        seasonElo: true,
        matchesPlayed: true,
        createdAt: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get match stats
    const [wins, recentMatches] = await Promise.all([
      prisma.match.count({
        where: { winnerId: id, deletedAt: null },
      }),
      prisma.match.findMany({
        where: {
          OR: [{ player1Id: id }, { player2Id: id }],
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          player1Id: true,
          player2Id: true,
          player1Score: true,
          player2Score: true,
          winnerId: true,
          player1EloChange: true,
          player2EloChange: true,
          createdAt: true,
        },
      }),
    ]);

    // Get all ELOs for percentile calculation
    const allElos = await prisma.user.findMany({
      where: { isBanned: false },
      select: { foreverElo: true },
    });
    const eloValues = allElos.map(u => u.foreverElo);

    // Get last match date
    const lastMatch = await prisma.match.findFirst({
      where: {
        OR: [{ player1Id: id }, { player2Id: id }],
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    const rustyStatus = checkRustyStatus(lastMatch?.createdAt || null);
    const losses = user.matchesPlayed - wins;
    const winRate = user.matchesPlayed > 0 ? (wins / user.matchesPlayed) * 100 : 0;

    return NextResponse.json({
      user: {
        ...user,
        wins,
        losses,
        winRate: Math.round(winRate * 10) / 10,
        lastMatchDate: lastMatch?.createdAt || null,
        isRusty: rustyStatus.isRusty,
        weeksSinceLastMatch: rustyStatus.weeksSinceLastMatch,
        kFactorLabel: getKFactorLabel(user.matchesPlayed),
        eloTier: getEloTierLabel(user.foreverElo),
        percentile: calculatePercentile(user.foreverElo, eloValues),
      },
      recentMatches,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id] - Update user (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response: authResponse } = await getAdminSessionOrForbidden();
    if (authResponse) return authResponse;

    const { id } = await params;
    const body = await request.json();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.isBanned !== undefined) {
      updateData.isBanned = body.isBanned;
      updateData.banReason = body.banReason || null;
    }
    if (body.foreverElo !== undefined) updateData.foreverElo = body.foreverElo;
    if (body.seasonElo !== undefined) updateData.seasonElo = body.seasonElo;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        image: true,
        foreverElo: true,
        seasonElo: true,
        matchesPlayed: true,
        role: true,
        isBanned: true,
        banReason: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id] - Soft delete user (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response: authResponse } = await getAdminSessionOrForbidden();
    if (authResponse) return authResponse;

    const { id } = await params;

    // Prevent deleting yourself
    if (id === session!.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
