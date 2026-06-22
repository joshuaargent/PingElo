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
    const { challengedId, stakeAmount = 5, isTeamChallenge = false, team1Id, team2Id } = body;

    if (!challengedId) {
      return NextResponse.json({ error: "Challenged user ID required" }, { status: 400 });
    }

    if (challengedId === challengerId) {
      return NextResponse.json({ error: "Cannot challenge yourself" }, { status: 400 });
    }

    // Validate stake amount (min 5, max 25)
    const MIN_STAKE = 5;
    const MAX_STAKE = 25;
    if (stakeAmount < MIN_STAKE) {
      return NextResponse.json({ error: `Minimum stake is ${MIN_STAKE} ELO` }, { status: 400 });
    }
    if (stakeAmount > MAX_STAKE) {
      return NextResponse.json({ error: `Maximum stake is ${MAX_STAKE} ELO` }, { status: 400 });
    }

    // For team challenges, require team IDs
    if (isTeamChallenge) {
      if (!team1Id || !team2Id) {
        return NextResponse.json({ error: "Team IDs required for team challenges" }, { status: 400 });
      }
    }

    // For team challenges, check team ELO. For regular challenges, check user ELO.
    let challengerTeamElo: number | null = null;
    let challengedTeamElo: number | null = null;

    if (isTeamChallenge && team1Id && team2Id) {
      // Get challenger and challenged teams
      const challengerTeam = await prisma.team.findUnique({
        where: { id: team1Id },
        include: { player1: true, player2: true }
      });
      const challengedTeam = await prisma.team.findUnique({
        where: { id: team2Id },
        include: { player1: true, player2: true }
      });

      if (!challengerTeam || !challengedTeam) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      // Check if challenger is on team1
      if (challengerTeam.player1Id !== challengerId && challengerTeam.player2Id !== challengerId) {
        return NextResponse.json({ error: "You must be on the team you're challenging from" }, { status: 403 });
      }

      // Check if challenged is on team2
      if (challengedTeam.player1Id !== challengedId && challengedTeam.player2Id !== challengedId) {
        return NextResponse.json({ error: "Challenged player must be on the team being challenged" }, { status: 403 });
      }

      // Check team ELO
      if (challengerTeam.foreverElo < stakeAmount) {
        return NextResponse.json({ error: `Your team has ${challengerTeam.foreverElo} ELO but needs ${stakeAmount} ELO for the stake` }, { status: 400 });
      }
      if (challengedTeam.foreverElo < stakeAmount) {
        return NextResponse.json({ error: `Opponent team has ${challengedTeam.foreverElo} ELO but needs ${stakeAmount} ELO for the stake` }, { status: 400 });
      }

      challengerTeamElo = challengerTeam.foreverElo;
      challengedTeamElo = challengedTeam.foreverElo;
    } else {
      // Regular (non-team) challenge - check user ELO
      const challenger = await prisma.user.findUnique({
        where: { id: challengerId },
        select: { foreverElo: true },
      });

      if (!challenger) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (challenger.foreverElo < stakeAmount) {
        return NextResponse.json({ error: `Not enough ELO. You have ${challenger.foreverElo} ELO but need ${stakeAmount} ELO for the stake` }, { status: 400 });
      }

      // Check if challenged user exists and has enough ELO
      const challenged = await prisma.user.findUnique({
        where: { id: challengedId },
        select: { id: true, name: true, image: true, foreverElo: true },
      });

      if (!challenged) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (challenged.foreverElo < stakeAmount) {
        return NextResponse.json({ error: `${challenged.name} doesn't have enough ELO (${challenged.foreverElo}) for the ${stakeAmount} ELO stake` }, { status: 400 });
      }
    }

    // Check for existing pending challenge
    const existing = await prisma.challenge.findFirst({
      where: {
        challengerId,
        challengedId,
        status: "PENDING",
        expiresAt: { gte: new Date() },
        isTeamChallenge,
        ...(isTeamChallenge ? { team1Id, team2Id } : {}),
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Pending challenge already exists" }, { status: 400 });
    }

    // Get opponent name for history
    const challengedUser = await prisma.user.findUnique({
      where: { id: challengedId },
      select: { name: true },
    });

    // Deduct stake ELO (from team or user)
    if (isTeamChallenge && team1Id) {
      await prisma.team.update({
        where: { id: team1Id },
        data: { foreverElo: { decrement: stakeAmount } },
      });

      // Create team ELO history
      await prisma.teamEloHistory.create({
        data: {
          teamId: team1Id,
          changeType: 'CHALLENGE_STAKE',
          eloBefore: challengerTeamElo || 0,
          eloAfter: (challengerTeamElo || 0) - stakeAmount,
          change: -stakeAmount,
          description: `Challenge stake against ${challengedUser?.name || 'opponent'}`,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: challengerId },
        data: { foreverElo: { decrement: stakeAmount } },
      });

      // Create ELO history entry for the stake
      await prisma.eloHistory.create({
        data: {
          userId: challengerId,
          changeType: 'ADMIN_ADJUSTMENT',
          eloBefore: challengerTeamElo || 0,
          eloAfter: (challengerTeamElo || 0) - stakeAmount,
          change: -stakeAmount,
          description: `Challenge stake against ${challengedUser?.name || 'opponent'}`,
        },
      });
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
        isTeamChallenge,
        ...(isTeamChallenge && { team1Id, team2Id }),
      },
      include: {
        challenger: {
          select: { id: true, name: true, image: true, foreverElo: true },
        },
        challenged: {
          select: { id: true, name: true, image: true, foreverElo: true },
        },
      },
    });

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error) {
    console.error("Error creating challenge:", error);
    return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 });
  }
}
