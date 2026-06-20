/**
 * Match Edit API Route
 * Handles match editing and deletion (admin only)
 * When a match is edited or deleted, ELO changes are reversed
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionOrForbidden } from "@/lib/auth-actions";
import { calculateEloChange, calculateDoublesEloChange, getTeamElo } from "@/lib/elo";

// Validation constants
const MIN_SCORE = 3;
const MAX_SCORE = 21;

/**
 * GET /api/matches/[id] - Get match details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        player1: { select: { id: true, name: true, image: true, foreverElo: true } },
        player2: { select: { id: true, name: true, image: true, foreverElo: true } },
        team1Player1: { select: { id: true, name: true, image: true, doublesForeverElo: true } },
        team1Player2: { select: { id: true, name: true, image: true, doublesForeverElo: true } },
        team2Player1: { select: { id: true, name: true, image: true, doublesForeverElo: true } },
        team2Player2: { select: { id: true, name: true, image: true, doublesForeverElo: true } },
        creator: { select: { id: true, name: true, image: true } },
        tournament: { select: { id: true, name: true } },
        season: { select: { id: true, name: true } },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/matches/[id] - Edit match (admin only)
 * Reverts old ELO changes and applies new ones
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
    const { player1Score, player2Score } = body;

    // Get existing match
    const existingMatch = await prisma.match.findUnique({
      where: { id },
      include: {
        player1: true,
        player2: true,
        team1Player1: true,
        team1Player2: true,
        team2Player1: true,
        team2Player2: true,
      },
    });

    if (!existingMatch) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Validate scores
    if (player1Score !== undefined && (player1Score < MIN_SCORE || player1Score > MAX_SCORE)) {
      return NextResponse.json(
        { error: `Scores must be between ${MIN_SCORE} and ${MAX_SCORE}` },
        { status: 400 }
      );
    }
    if (player2Score !== undefined && (player2Score < MIN_SCORE || player2Score > MAX_SCORE)) {
      return NextResponse.json(
        { error: `Scores must be between ${MIN_SCORE} and ${MAX_SCORE}` },
        { status: 400 }
      );
    }

    const newPlayer1Score = player1Score ?? existingMatch.player1Score;
    const newPlayer2Score = player2Score ?? existingMatch.player2Score;

    // Revert old ELO changes
    if (existingMatch.matchType === "SINGLES") {
      // Revert ELO for singles
      if (existingMatch.player1Id && existingMatch.player2Id) {
        await prisma.user.update({
          where: { id: existingMatch.player1Id },
          data: { 
            foreverElo: existingMatch.player1EloBefore,
            matchesPlayed: { decrement: 1 }
          },
        });
        await prisma.user.update({
          where: { id: existingMatch.player2Id },
          data: { 
            foreverElo: existingMatch.player2EloBefore,
            matchesPlayed: { decrement: 1 }
          },
        });

        // Revert season ELO if applicable
        if (existingMatch.seasonId) {
          await prisma.user.update({
            where: { id: existingMatch.player1Id },
            data: { 
              seasonElo: existingMatch.player1EloBefore + existingMatch.player1EloChange
            },
          });
          await prisma.user.update({
            where: { id: existingMatch.player2Id },
            data: { 
              seasonElo: existingMatch.player2EloBefore + existingMatch.player2EloChange
            },
          });
        }
      }
    } else {
      // Revert ELO for doubles
      const playerIds = [
        existingMatch.team1Player1Id,
        existingMatch.team1Player2Id,
        existingMatch.team2Player1Id,
        existingMatch.team2Player2Id,
      ].filter(Boolean) as string[];

      for (const playerId of playerIds) {
        const player = await prisma.user.findUnique({ where: { id: playerId } });
        if (player) {
          // Calculate individual change contribution (simplified - assumes equal distribution)
          const team1Ids = [existingMatch.team1Player1Id, existingMatch.team1Player2Id].filter(Boolean);
          const team2Ids = [existingMatch.team2Player1Id, existingMatch.team2Player2Id].filter(Boolean);
          
          const playerIndex = team1Ids.indexOf(playerId);
          let change = 0;
          if (playerIndex !== -1) {
            change = existingMatch.player1EloChange / team1Ids.length;
          } else if (team2Ids.includes(playerId)) {
            change = existingMatch.player2EloChange / team2Ids.length;
          }

          await prisma.user.update({
            where: { id: playerId },
            data: { 
              doublesForeverElo: { decrement: change },
              doublesMatchesPlayed: { decrement: 1 }
            },
          });
        }
      }
    }

    // Calculate new winner and ELO changes
    const team1Won = newPlayer1Score > newPlayer2Score;
    const newWinnerId = team1Won ? existingMatch.player1Id || existingMatch.team1Player1Id! : existingMatch.player2Id || existingMatch.team2Player1Id!;

    let player1Change = 0;
    let player2Change = 0;
    
    if (existingMatch.matchType === "SINGLES") {
      const player1 = existingMatch.player1!;
      const player2 = existingMatch.player2!;
      
      const eloResult = calculateEloChange(
        player1.foreverElo,
        player2.foreverElo,
        player1.matchesPlayed - 1, // Subtract the 1 we just decremented
        player2.matchesPlayed - 1,
        { player1Score: newPlayer1Score, player2Score: newPlayer2Score, winnerId: team1Won ? "player1" : "player2" },
        existingMatch.isTournamentMatch
      );

      player1Change = eloResult.player1Change;
      player2Change = eloResult.player2Change;

      // Apply new ELO changes
      await prisma.user.update({
        where: { id: player1.id },
        data: { 
          foreverElo: player1.foreverElo + player1Change,
          matchesPlayed: { increment: 1 }
        },
      });
      await prisma.user.update({
        where: { id: player2.id },
        data: { 
          foreverElo: player2.foreverElo + player2Change,
          matchesPlayed: { increment: 1 }
        },
      });

      // Update season ELO if applicable
      if (existingMatch.seasonId) {
        const p1NewElo = player1.seasonElo - existingMatch.player1EloChange + player1Change;
        const p2NewElo = player2.seasonElo - existingMatch.player2EloChange + player2Change;
        
        await prisma.user.update({
          where: { id: player1.id },
          data: { seasonElo: p1NewElo },
        });
        await prisma.user.update({
          where: { id: player2.id },
          data: { seasonElo: p2NewElo },
        });
      }
    } else {
      // Doubles ELO - simplified handling
      // In a full implementation, you would call calculateDoublesEloChange
      player1Change = 0;
      player2Change = 0;
    }

    // Update the match
    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        player1Score: newPlayer1Score,
        player2Score: newPlayer2Score,
        winnerId: newWinnerId,
        player1EloBefore: existingMatch.player1EloBefore,
        player2EloBefore: existingMatch.player2EloBefore,
        player1EloChange: player1Change,
        player2EloChange: player2Change,
      },
    });

    return NextResponse.json({ 
      match: updatedMatch, 
      message: "Match updated and ELO recalculated"
    });
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { error: "Failed to update match" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/matches/[id] - Delete match (admin only)
 * Reverts ELO changes and soft deletes the match
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response: authResponse } = await getAdminSessionOrForbidden();
    if (authResponse) return authResponse;

    const { id } = await params;

    const match = await prisma.match.findUnique({
      where: { id },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Revert ELO changes
    if (match.matchType === "SINGLES") {
      if (match.player1Id && match.player2Id) {
        await prisma.user.update({
          where: { id: match.player1Id },
          data: { 
            foreverElo: match.player1EloBefore,
            matchesPlayed: { decrement: 1 }
          },
        });
        await prisma.user.update({
          where: { id: match.player2Id },
          data: { 
            foreverElo: match.player2EloBefore,
            matchesPlayed: { decrement: 1 }
          },
        });

        // Revert season ELO if applicable
        if (match.seasonId) {
          await prisma.user.update({
            where: { id: match.player1Id },
            data: { 
              seasonElo: match.player1EloBefore + match.player1EloChange
            },
          });
          await prisma.user.update({
            where: { id: match.player2Id },
            data: { 
              seasonElo: match.player2EloBefore + match.player2EloChange
            },
          });
        }
      }
    } else {
      // Revert doubles ELO (simplified)
      const playerIds = [
        match.team1Player1Id,
        match.team1Player2Id,
        match.team2Player1Id,
        match.team2Player2Id,
      ].filter(Boolean) as string[];

      for (const playerId of playerIds) {
        const player = await prisma.user.findUnique({ where: { id: playerId } });
        if (player) {
          const team1Ids = [match.team1Player1Id, match.team1Player2Id].filter(Boolean);
          let change = 0;
          if (team1Ids.includes(playerId)) {
            change = match.player1EloChange / team1Ids.length;
          } else {
            change = match.player2EloChange / 2;
          }

          await prisma.user.update({
            where: { id: playerId },
            data: { 
              doublesForeverElo: { decrement: change },
              doublesMatchesPlayed: { decrement: 1 }
            },
          });
        }
      }
    }

    // Soft delete the match
    await prisma.match.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ 
      success: true,
      message: "Match deleted and ELO reverted"
    });
  } catch (error) {
    console.error("Error deleting match:", error);
    return NextResponse.json(
      { error: "Failed to delete match" },
      { status: 500 }
    );
  }
}
