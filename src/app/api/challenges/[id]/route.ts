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

        // Handle team vs individual challenge
        if (challenge.isTeamChallenge && challenge.team2Id) {
          // Get challenged team
          const challengedTeam = await prisma.team.findUnique({
            where: { id: challenge.team2Id },
            include: { player1: true, player2: true }
          });

          if (!challengedTeam) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
          }

          // Check if challenged user is on the team
          if (challengedTeam.player1Id !== userId && challengedTeam.player2Id !== userId) {
            return NextResponse.json({ error: "You must be on the team being challenged" }, { status: 403 });
          }

          // Check team ELO
          if (challengedTeam.foreverElo < challenge.stakeAmount) {
            return NextResponse.json({ error: `Your team has ${challengedTeam.foreverElo} ELO but needs ${challenge.stakeAmount} ELO for the stake` }, { status: 400 });
          }

          // Deduct stake from team
          await prisma.team.update({
            where: { id: challenge.team2Id },
            data: { foreverElo: { decrement: challenge.stakeAmount } },
          });

          // Get challenger name for history
          const challengerUser = await prisma.user.findUnique({
            where: { id: challenge.challengerId },
            select: { name: true },
          });

          // Record team ELO history
          await prisma.teamEloHistory.create({
            data: {
              teamId: challenge.team2Id,
              changeType: 'CHALLENGE_STAKE',
              eloBefore: challengedTeam.foreverElo,
              eloAfter: challengedTeam.foreverElo - challenge.stakeAmount,
              change: -challenge.stakeAmount,
              description: `Challenge accepted vs ${challengerUser?.name || 'opponent'}`,
            },
          });
        } else {
          // Individual challenge
          // Deduct stake ELO from challenged user (they must also put up matching stake)
          await prisma.user.update({
            where: { id: challenge.challengedId },
            data: { foreverElo: { decrement: challenge.stakeAmount } },
          });

          // Record in ELO history
          const challengedBefore = await prisma.user.findUnique({
            where: { id: challenge.challengedId },
            select: { foreverElo: true },
          });
          
          await prisma.eloHistory.create({
            data: {
              userId: challenge.challengedId,
              changeType: 'ADMIN_ADJUSTMENT',
              eloBefore: (challengedBefore?.foreverElo || 0) + challenge.stakeAmount,
              eloAfter: challengedBefore?.foreverElo || 0,
              change: -challenge.stakeAmount,
              description: `Challenge accepted vs ${challenge.challengerId}`,
            },
          });
        }

        const updated = await prisma.challenge.update({
          where: { id },
          data: { status: "ACCEPTED" },
          include: {
            challenger: { select: { id: true, name: true, foreverElo: true } },
            challenged: { select: { id: true, name: true, foreverElo: true } },
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

        // Handle team vs individual challenge for refund
        if (challenge.isTeamChallenge && challenge.team1Id) {
          // Refund to challenger team
          const challengerTeam = await prisma.team.findUnique({
            where: { id: challenge.team1Id },
          });

          if (challengerTeam) {
            await prisma.team.update({
              where: { id: challenge.team1Id },
              data: { foreverElo: { increment: challenge.stakeAmount } },
            });

            const challengedUser = await prisma.user.findUnique({
              where: { id: challenge.challengedId },
              select: { name: true },
            });

            await prisma.teamEloHistory.create({
              data: {
                teamId: challenge.team1Id,
                changeType: 'CHALLENGE_REFUND',
                eloBefore: challengerTeam.foreverElo,
                eloAfter: challengerTeam.foreverElo + challenge.stakeAmount,
                change: challenge.stakeAmount,
                description: `Challenge declined by ${challengedUser?.name || 'opponent'} - refund`,
              },
            });
          }
        } else {
          // Individual refund
          const challengerBefore = await prisma.user.update({
            where: { id: challenge.challengerId },
            data: { foreverElo: { increment: challenge.stakeAmount } },
          });
          
          await prisma.eloHistory.create({
            data: {
              userId: challenge.challengerId,
              changeType: 'ADMIN_ADJUSTMENT',
              eloBefore: challengerBefore.foreverElo - challenge.stakeAmount,
              eloAfter: challengerBefore.foreverElo,
              change: challenge.stakeAmount,
              description: `Challenge declined - stake refunded`,
            },
          });
        }

        const updated = await prisma.challenge.update({
          where: { id },
          data: { status: "DECLINED" },
          include: {
            challenger: { select: { id: true, name: true, foreverElo: true } },
            challenged: { select: { id: true, name: true, foreverElo: true } },
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

        // Handle team vs individual challenge for refund
        if (challenge.isTeamChallenge && challenge.team1Id) {
          // Refund to challenger team
          const challengerTeam = await prisma.team.findUnique({
            where: { id: challenge.team1Id },
          });

          if (challengerTeam) {
            await prisma.team.update({
              where: { id: challenge.team1Id },
              data: { foreverElo: { increment: challenge.stakeAmount } },
            });

            const challengedUser = await prisma.user.findUnique({
              where: { id: challenge.challengedId },
              select: { name: true },
            });

            await prisma.teamEloHistory.create({
              data: {
                teamId: challenge.team1Id,
                changeType: 'CHALLENGE_REFUND',
                eloBefore: challengerTeam.foreverElo,
                eloAfter: challengerTeam.foreverElo + challenge.stakeAmount,
                change: challenge.stakeAmount,
                description: `Challenge cancelled - refund to challenger team`,
              },
            });
          }

          // If challenge was ACCEPTED, also refund the challenged team
          if (challenge.status === "ACCEPTED" && challenge.team2Id) {
            const challengedTeam = await prisma.team.findUnique({
              where: { id: challenge.team2Id },
            });

            if (challengedTeam) {
              await prisma.team.update({
                where: { id: challenge.team2Id },
                data: { foreverElo: { increment: challenge.stakeAmount } },
              });

              const challengerUser = await prisma.user.findUnique({
                where: { id: challenge.challengerId },
                select: { name: true },
              });

              await prisma.teamEloHistory.create({
                data: {
                  teamId: challenge.team2Id,
                  changeType: 'CHALLENGE_REFUND',
                  eloBefore: challengedTeam.foreverElo,
                  eloAfter: challengedTeam.foreverElo + challenge.stakeAmount,
                  change: challenge.stakeAmount,
                  description: `Challenge cancelled - refund to challenged team by ${challengerUser?.name || 'opponent'}`,
                },
              });
            }
          }
        } else {
          // Individual refund
          const challengerBefore = await prisma.user.update({
            where: { id: challenge.challengerId },
            data: { foreverElo: { increment: challenge.stakeAmount } },
          });
          
          await prisma.eloHistory.create({
            data: {
              userId: challenge.challengerId,
              changeType: 'ADMIN_ADJUSTMENT',
              eloBefore: challengerBefore.foreverElo - challenge.stakeAmount,
              eloAfter: challengerBefore.foreverElo,
              change: challenge.stakeAmount,
              description: `Challenge cancelled - stake refunded`,
            },
          });

          // If challenge was ACCEPTED, also refund the challenged player's stake
          if (challenge.status === "ACCEPTED") {
            const challengedBefore = await prisma.user.update({
              where: { id: challenge.challengedId },
              data: { foreverElo: { increment: challenge.stakeAmount } },
            });
            
            await prisma.eloHistory.create({
              data: {
                userId: challenge.challengedId,
                changeType: 'ADMIN_ADJUSTMENT',
                eloBefore: challengedBefore.foreverElo - challenge.stakeAmount,
                eloAfter: challengedBefore.foreverElo,
                change: challenge.stakeAmount,
                description: `Challenge cancelled - stake refunded`,
              },
            });
          }
        }

        const updated = await prisma.challenge.update({
          where: { id },
          data: { status: "CANCELLED" },
          include: {
            challenger: { select: { id: true, name: true, foreverElo: true } },
            challenged: { select: { id: true, name: true, foreverElo: true } },
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

        // Get the match winner from the request body
        const body = await request.clone().json();
        const { winnerId } = body;

        if (!winnerId || (winnerId !== challenge.challengerId && winnerId !== challenge.challengedId)) {
          return NextResponse.json({ error: "Valid winner ID required" }, { status: 400 });
        }

        // Pay out stake to winner (stake is in escrow, so winner gets their stake back + opponent's stake)
        const loserId = winnerId === challenge.challengerId ? challenge.challengedId : challenge.challengerId;
        const totalPayout = challenge.stakeAmount * 2; // Winner gets both stakes

        // Update winner's ELO (they get their stake back + opponent's stake)
        const winnerBefore = await prisma.user.update({
          where: { id: winnerId },
          data: { foreverElo: { increment: totalPayout } },
        });

        // Record payout in ELO history for winner
        await prisma.eloHistory.create({
          data: {
            userId: winnerId,
            changeType: 'TOURNAMENT_WIN',
            eloBefore: winnerBefore.foreverElo - totalPayout,
            eloAfter: winnerBefore.foreverElo,
            change: totalPayout,
            description: `Challenge won against ${winnerId === challenge.challengerId ? challenge.challengedId : challenge.challengerId}`,
          },
        });

        const updated = await prisma.challenge.update({
          where: { id },
          data: { 
            status: "COMPLETED",
            winnerId: winnerId,
          },
          include: {
            challenger: { select: { id: true, name: true, foreverElo: true } },
            challenged: { select: { id: true, name: true, foreverElo: true } },
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
