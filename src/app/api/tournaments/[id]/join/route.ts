/**
 * Tournament Join API Route
 * Handles player/team registration for tournaments
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";
import { calculateEntryFee } from "@/lib/elo";

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

      if (team.player1.isBanned || team.player2.isBanned) {
        return NextResponse.json({ error: "A team member is banned" }, { status: 403 });
      }

      const existing = await prisma.tournamentParticipant.findUnique({
        where: { tournamentId_teamId: { tournamentId, teamId } },
      });

      if (existing) {
        return NextResponse.json({ error: "This team is already registered" }, { status: 400 });
      }

      const playerAlreadyRegistered = await prisma.tournamentParticipant.findFirst({
        where: {
          tournamentId,
          teamId: { not: teamId },
          team: {
            OR: [
              { player1Id: team.player1Id },
              { player2Id: team.player1Id },
              { player1Id: team.player2Id },
              { player2Id: team.player2Id },
            ],
          },
        },
      });

      if (playerAlreadyRegistered) {
        return NextResponse.json({
          error: "One of the team members is already registered with another team in this tournament"
        }, { status: 400 });
      }

      const entryFee = calculateEntryFee(team.foreverElo);

      if (team.foreverElo < entryFee) {
        return NextResponse.json({ error: `Insufficient team ELO (${team.foreverElo}). Need at least ${entryFee}.` }, { status: 400 });
      }

      const participant = await prisma.$transaction(async (tx) => {
        // Add entry fee to tournament prize pool
        if (entryFee > 0) {
          await tx.tournament.update({
            where: { id: tournamentId },
            data: { prizePool: tournament.prizePool + entryFee },
          });
        }

        if (entryFee > 0) {
          await tx.team.update({
            where: { id: teamId },
            data: { foreverElo: team.foreverElo - entryFee },
          });

          // Create ELO history entries for both players
          const feePerPlayer = Math.floor(entryFee / 2);
          for (const player of [team.player1, team.player2]) {
            await tx.eloHistory.create({
              data: {
                userId: player.id,
                changeType: 'TOURNAMENT_ENTRY',
                eloBefore: player.foreverElo,
                eloAfter: player.foreverElo - feePerPlayer,
                change: -feePerPlayer,
                description: `Entry fee for tournament: ${tournament.name}`,
                metadata: {
                  tournamentId,
                  teamId,
                  entryFee,
                },
              },
            });
          }
        }

        return tx.tournamentParticipant.create({
          data: {
            tournamentId,
            teamId,
            eloAtEntry: team.foreverElo,
            paidEntry: entryFee === 0 || entryFee > 0,
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
        entryFee,
        message: entryFee > 0 ? `Team paid ${entryFee} ELO to join` : "Team joined for free",
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
      const entryFee = participant.eloAtEntry - team.foreverElo;
      const feePerPlayer = Math.floor(entryFee / 2);

      await prisma.$transaction(async (tx) => {
        if (entryFee > 0) {
          await tx.team.update({
            where: { id: team.id },
            data: { foreverElo: team.foreverElo + entryFee },
          });

          // Refund both players and create history entries
          for (const player of [team.player1, team.player2]) {
            await tx.eloHistory.create({
              data: {
                userId: player.id,
                changeType: 'TOURNAMENT_ENTRY',
                eloBefore: player.foreverElo,
                eloAfter: player.foreverElo + feePerPlayer,
                change: feePerPlayer,
                description: `Refund for leaving tournament: ${tournament.name}`,
                metadata: {
                  tournamentId,
                  teamId: team.id,
                  isRefund: true,
                },
              },
            });
          }
        }
        await tx.tournamentParticipant.delete({ where: { id: participant.id } });
      });

      return NextResponse.json({ success: true, message: "Left tournament" });
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
