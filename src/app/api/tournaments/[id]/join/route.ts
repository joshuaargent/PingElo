/**
 * Tournament Join API Route
 * Handles player/team registration for tournaments
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";
import { calculateEntryFee, calculateDoublesEntryFee } from "@/lib/elo";

// POST /api/tournaments/[id]/join - Join a tournament
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;

    const { id: tournamentId } = await params;
    const userId = session!.user.id;
    const body = await request.json().catch(() => ({}));
    const { teamId } = body;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: { select: { participants: true } },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.status !== "REGISTRATION_OPEN") {
      return NextResponse.json({ error: "Tournament is not open for registration" }, { status: 400 });
    }

    if (tournament._count.participants >= tournament.maxParticipants) {
      return NextResponse.json({ error: "Tournament is full" }, { status: 400 });
    }

    // Handle doubles tournament with team
    if (tournament.matchType === "DOUBLES") {
      if (!teamId) {
        return NextResponse.json({ error: "Team ID required for doubles tournaments" }, { status: 400 });
      }

      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: { player1: true, player2: true },
      });

      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      if (!team.isActive) {
        return NextResponse.json({ error: "Team is inactive. Please reactivate your team first." }, { status: 400 });
      }

      if (team.player1Id !== userId && team.player2Id !== userId) {
        return NextResponse.json({ error: "You are not a member of this team" }, { status: 403 });
      }

      if (team.player1.isBanned || team.player2?.isBanned) {
        return NextResponse.json({ error: "A team member is banned" }, { status: 403 });
      }

      const existing = await prisma.tournamentParticipant.findUnique({
        where: { tournamentId_teamId: { tournamentId, teamId } },
      });

      if (existing) {
        return NextResponse.json({ error: "This team is already registered" }, { status: 400 });
      }

      // Check if either team member is already registered
      const p1Id = team.player1Id;
      const p2Id = team.player2Id;
      const playerAlreadyRegistered = await prisma.tournamentParticipant.findFirst({
        where: {
          tournamentId,
          teamId: { not: teamId },
          team: {
            OR: [
              { player1Id: p1Id },
              { player2Id: p1Id },
              ...(p2Id ? [{ player1Id: p2Id }, { player2Id: p2Id }] : []),
            ],
          },
        },
      });

      if (playerAlreadyRegistered) {
        return NextResponse.json({
          error: "One of the team members is already registered with another team in this tournament"
        }, { status: 400 });
      }

      // Calculate entry fee based on team ELO, not individual singles ELO
      // The team ELO represents the team's doubles skill level
      const teamElo = team.foreverElo; // This is the team's doubles ELO
      const feePerTeam = calculateEntryFee(teamElo);
      const totalEntryFee = feePerTeam; // One fee for the whole team

      // Check if team has enough ELO
      if (teamElo < feePerTeam) {
        return NextResponse.json({ 
          error: `Insufficient team ELO (${teamElo}). Need at least ${feePerTeam} ELO to enter` 
        }, { status: 400 });
      }

      const participant = await prisma.$transaction(async (tx) => {
        // Add total entry fee to tournament prize pool
        if (totalEntryFee > 0) {
          await tx.tournament.update({
            where: { id: tournamentId },
            data: { prizePool: tournament.prizePool + totalEntryFee },
          });
        }

        // Deduct team ELO (not individual player ELO)
        if (feePerTeam > 0) {
          // Get fresh team data for accurate ELO tracking
          const freshTeam = await tx.team.findUnique({ where: { id: teamId } });
          const teamEloBefore = freshTeam?.foreverElo || teamElo;
          
          await tx.team.update({
            where: { id: teamId },
            data: { foreverElo: teamEloBefore - feePerTeam },
          });
          
          // Record ELO history for the team
          await tx.teamEloHistory.create({
            data: {
              teamId,
              changeType: 'TOURNAMENT_ENTRY',
              eloBefore: teamEloBefore,
              eloAfter: teamEloBefore - feePerTeam,
              change: -feePerTeam,
              description: `Entry fee for tournament: ${tournament.name}`,
              metadata: { tournamentId, isTeamEntry: true },
            },
          });
        }

        return tx.tournamentParticipant.create({
          data: {
            tournamentId,
            teamId,
            eloAtEntry: teamElo, // Use team ELO for tournament
            paidEntry: true,
          },
          include: {
            team: {
              include: {
                player1: { select: { id: true, name: true, image: true } },
                player2: { select: { id: true, name: true, image: true } },
              },
            },
          },
        });
      });

      return NextResponse.json({
        participant,
        entryFee: totalEntryFee,
        message: totalEntryFee > 0 ? `Team paid ${totalEntryFee} ELO to join` : "Team joined for free",
      }, { status: 201 });
    }

    // Handle singles tournament (individual registration)
    const existingParticipant = await prisma.tournamentParticipant.findUnique({
      where: { tournamentId_userId: { tournamentId, userId } },
    });

    if (existingParticipant) {
      return NextResponse.json({ error: "You are already registered" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isBanned) {
      return NextResponse.json({ error: "Banned users cannot join tournaments" }, { status: 403 });
    }

    const playerElo = user.foreverElo;
    const entryFee = calculateEntryFee(playerElo);
    const eloBefore = playerElo;

    if (playerElo < entryFee) {
      return NextResponse.json({ error: `Insufficient ELO (${playerElo}). Need at least ${entryFee}.` }, { status: 400 });
    }

    const participant = await prisma.$transaction(async (tx) => {
      // Add to prize pool first
      if (entryFee > 0) {
        await tx.tournament.update({
          where: { id: tournamentId },
          data: { prizePool: tournament.prizePool + entryFee },
        });
      }

      if (entryFee > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { foreverElo: playerElo - entryFee },
        });

        // Create ELO history entry
        await tx.eloHistory.create({
          data: {
            userId,
            changeType: 'TOURNAMENT_ENTRY',
            eloBefore,
            eloAfter: playerElo - entryFee,
            change: -entryFee,
            description: `Entry fee for tournament: ${tournament.name}`,
            metadata: {
              tournamentId,
            },
          },
        });
      }

      return tx.tournamentParticipant.create({
        data: {
          tournamentId,
          userId,
          eloAtEntry: playerElo,
          paidEntry: entryFee === 0 || entryFee > 0,
        },
        include: {
          user: { select: { id: true, name: true, image: true, foreverElo: true } },
        },
      });
    });

    return NextResponse.json({
      participant,
      entryFee,
      message: entryFee > 0 ? `You paid ${entryFee} ELO to join` : "You joined for free",
    }, { status: 201 });
  } catch (error) {
    console.error("Error joining tournament:", error);
    return NextResponse.json({ error: "Failed to join tournament" }, { status: 500 });
  }
}

// DELETE /api/tournaments/[id]/join - Leave a tournament
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;

    const { id: tournamentId } = await params;
    const userId = session!.user.id;

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.status !== "REGISTRATION_OPEN") {
      return NextResponse.json({ error: "Cannot leave after tournament started" }, { status: 400 });
    }

    if (tournament.matchType === "DOUBLES") {
      const participant = await prisma.tournamentParticipant.findFirst({
        where: {
          tournamentId,
          team: {
            OR: [{ player1Id: userId }, { player2Id: userId }],
          },
        },
        include: { 
          team: {
            include: { player1: true, player2: true },
          },
        },
      });

      if (!participant || !participant.team) {
        return NextResponse.json({ error: "Not registered" }, { status: 400 });
      }

      const team = participant.team;
      // Calculate fee based on team average ELO at entry
      const p1Elo = participant.player1EloAtEntry || team.player1.foreverElo;
      const p2Elo = participant.player2EloAtEntry || team.player2?.foreverElo || team.player1.foreverElo;
      const feePerPlayer = calculateDoublesEntryFee(p1Elo, p2Elo);
      const totalEntryFee = feePerPlayer * 2;

      await prisma.$transaction(async (tx) => {
        // Deduct from prize pool
        if (totalEntryFee > 0) {
          await tx.tournament.update({
            where: { id: tournamentId },
            data: { prizePool: tournament.prizePool - totalEntryFee },
          });
        }

        // Refund each player their fee
        if (feePerPlayer > 0) {
          await tx.user.update({
            where: { id: team.player1Id },
            data: { foreverElo: team.player1.foreverElo + feePerPlayer },
          });
          await tx.eloHistory.create({
            data: {
              userId: team.player1Id,
              changeType: 'TOURNAMENT_ENTRY',
              eloBefore: team.player1.foreverElo,
              eloAfter: team.player1.foreverElo + feePerPlayer,
              change: feePerPlayer,
              description: `Refund for leaving tournament: ${tournament.name}`,
              metadata: { tournamentId, teamId: team.id, isRefund: true },
            },
          });
          if (team.player2Id) {
            const p2Elo = team.player2?.foreverElo || team.player1.foreverElo;
            await tx.user.update({
              where: { id: team.player2Id },
              data: { foreverElo: p2Elo + feePerPlayer },
            });
            await tx.eloHistory.create({
              data: {
                userId: team.player2Id,
                changeType: 'TOURNAMENT_ENTRY',
                eloBefore: p2Elo,
                eloAfter: p2Elo + feePerPlayer,
                change: feePerPlayer,
                description: `Refund for leaving tournament: ${tournament.name}`,
                metadata: { tournamentId, teamId: team.id, isRefund: true },
              },
            });
          }
        }

        await tx.tournamentParticipant.delete({ where: { id: participant.id } });
      });

      return NextResponse.json({ success: true, refundAmount: totalEntryFee, message: "Left tournament" });
    }

    // Singles
    const participant = await prisma.tournamentParticipant.findUnique({
      where: { tournamentId_userId: { tournamentId, userId } },
    });

    if (!participant) {
      return NextResponse.json({ error: "Not registered" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const entryFee = participant.eloAtEntry - (user?.foreverElo || 0);
    const eloBefore = user?.foreverElo || 0;

    await prisma.$transaction(async (tx) => {
      // Deduct from prize pool
      if (entryFee > 0) {
        await tx.tournament.update({
          where: { id: tournamentId },
          data: { prizePool: tournament.prizePool - entryFee },
        });
      }

      if (entryFee > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { foreverElo: eloBefore + entryFee },
        });

        // Create refund history entry
        await tx.eloHistory.create({
          data: {
            userId,
            changeType: 'TOURNAMENT_ENTRY',
            eloBefore,
            eloAfter: eloBefore + entryFee,
            change: entryFee,
            description: `Refund for leaving tournament: ${tournament.name}`,
            metadata: {
              tournamentId,
              isRefund: true,
            },
          },
        });
      }
      await tx.tournamentParticipant.delete({ where: { id: participant.id } });
    });

    return NextResponse.json({ success: true, message: "Left tournament" });
  } catch (error) {
    console.error("Error leaving tournament:", error);
    return NextResponse.json({ error: "Failed to leave tournament" }, { status: 500 });
  }
}
