/**
 * Tournament Match Log API Route
 * Records match result and advances bracket
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await getSessionOrUnauthorized();
    if (response) return response;

    const { id: tournamentId } = await params;
    const body = await request.json();
    const { 
      player1Id, 
      player2Id, 
      player1Score, 
      player2Score, 
      winnerId,
      round,
      position
    } = body;

    // Validate required fields
    if (!player1Id || !player2Id || player1Score === undefined || player2Score === undefined || !winnerId) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate winner
    if (winnerId !== player1Id && winnerId !== player2Id) {
      return NextResponse.json(
        { error: "Winner must be one of the players" },
        { status: 400 }
      );
    }

    // Validate scores
    if (player1Score < 0 || player2Score < 0 || player1Score > 21 || player2Score > 21) {
      return NextResponse.json(
        { error: "Invalid scores" },
        { status: 400 }
      );
    }

    // Validate win condition
    const winnerScore = winnerId === player1Id ? player1Score : player2Score;
    const loserScore = winnerId === player1Id ? player2Score : player1Score;
    const maxScore = Math.max(player1Score, player2Score);
    
    if (winnerScore < 11 || winnerScore - loserScore < 2 || maxScore !== winnerScore) {
      return NextResponse.json(
        { error: "Invalid winning score. Must win by 2 with at least 11 points." },
        { status: 400 }
      );
    }

    // Get tournament with brackets
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        brackets: {
          orderBy: { round: 'asc' },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    if (tournament.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: "Tournament is not in progress" },
        { status: 400 }
      );
    }

    // Get player data
    const [player1, player2] = await Promise.all([
      prisma.user.findUnique({ where: { id: player1Id } }),
      prisma.user.findUnique({ where: { id: player2Id } }),
    ]);

    if (!player1 || !player2) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 400 }
      );
    }

    // Simple ELO calculation
    const winner = winnerId === player1Id ? player1 : player2;
    const loser = winnerId === player1Id ? player2 : player1;
    
    // K-factor
    const k = 32;
    const winnerChange = Math.round(k * 0.5); // Simplified: always +16
    const loserChange = Math.round(k * -0.5); // Simplified: always -16

    // Create match record
    const match = await prisma.match.create({
      data: {
        player1Id,
        player2Id,
        player1Score,
        player2Score,
        winnerId,
        player1EloBefore: player1.foreverElo,
        player2EloBefore: player2.foreverElo,
        player1EloChange: winnerId === player1Id ? winnerChange : loserChange,
        player2EloChange: winnerId === player2Id ? winnerChange : loserChange,
        createdById: winnerId,
        isTournamentMatch: true,
      },
    });

    // Update player ELOs
    await prisma.user.update({
      where: { id: winnerId },
      data: { 
        foreverElo: { increment: winnerChange },
        seasonElo: { increment: winnerChange },
        matchesPlayed: { increment: 1 },
      },
    });

    await prisma.user.update({
      where: { id: (winnerId === player1Id ? player2Id : player1Id) },
      data: { 
        foreverElo: { increment: loserChange },
        seasonElo: { increment: loserChange },
        matchesPlayed: { increment: 1 },
      },
    });

    // Find and update the bracket slot
    const bracketSlot = tournament.brackets.find(
      b => b.round === round && b.position === position
    );

    if (bracketSlot) {
      await prisma.tournamentBracket.update({
        where: { id: bracketSlot.id },
        data: { matchId: match.id },
      });
    }

    // Find next bracket slot for advancement
    const nextRound = (round || 1) + 1;
    const nextPosition = Math.ceil(position / 2);
    
    const nextSlot = tournament.brackets.find(
      b => b.round === nextRound && b.position === nextPosition
    );

    if (nextSlot) {
      // Tournament not complete yet - just mark the match
      // Advancement logic would need a separate mechanism
    } else {
      // This was the final match - tournament complete!
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'COMPLETED' },
      });

      // Give winner bonus ELO from prize pool
      if (tournament.prizePool) {
        await prisma.user.update({
          where: { id: winnerId },
          data: { 
            foreverElo: { increment: tournament.prizePool },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      match,
      eloChanges: {
        winner: { id: winnerId, newElo: winner.foreverElo + winnerChange, change: winnerChange },
        loser: { id: loser.id, newElo: loser.foreverElo + loserChange, change: loserChange },
      },
    });
  } catch (error) {
    console.error("Error logging match:", error);
    return NextResponse.json(
      { error: "Failed to log match" },
      { status: 500 }
    );
  }
}
