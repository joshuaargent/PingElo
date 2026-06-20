/**
 * Tournament Start API Route
 * Generates bracket and starts the tournament
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionOrForbidden } from "@/lib/auth-actions";

/**
 * Generate bracket matchups based on format
 */
function generateBracket(participants: { id: string; eloAtEntry: number }[], format: string) {
  const bracketSlots: { round: number; matchNumber: number; player1Id?: string; player2Id?: string }[] = [];
  
  // Shuffle participants randomly for first round
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  
  const numPlayers = shuffled.length;
  
  if (format === 'SINGLE_ELIMINATION') {
    // Calculate number of rounds needed
    const numRounds = Math.ceil(Math.log2(numPlayers));
    const bracketSize = Math.pow(2, numRounds);
    
    // Generate first round matches
    let matchNumber = 1;
    for (let i = 0; i < bracketSize; i += 2) {
      if (i + 1 < numPlayers) {
        bracketSlots.push({
          round: 1,
          matchNumber: matchNumber++,
          player1Id: shuffled[i].id,
          player2Id: shuffled[i + 1].id,
        });
      } else {
        // Bye - player auto-advances
        bracketSlots.push({
          round: 1,
          matchNumber: matchNumber++,
          player1Id: shuffled[i].id,
        });
      }
    }
    
    // Generate subsequent rounds (placeholder slots)
    for (let round = 2; round <= numRounds; round++) {
      const matchesInRound = bracketSize / Math.pow(2, round);
      for (let i = 0; i < matchesInRound; i++) {
        bracketSlots.push({
          round,
          matchNumber: i + 1,
        });
      }
    }
  } else if (format === 'ROUND_ROBIN') {
    // Everyone plays everyone
    for (let i = 0; i < shuffled.length; i++) {
      for (let j = i + 1; j < shuffled.length; j++) {
        bracketSlots.push({
          round: 1,
          matchNumber: bracketSlots.length + 1,
          player1Id: shuffled[i].id,
          player2Id: shuffled[j].id,
        });
      }
    }
  }
  
  return bracketSlots;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin session
    const { response } = await getAdminSessionOrForbidden();
    if (response) return response;

    const { id } = await params;

    // Get tournament with participants
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, foreverElo: true },
            },
          },
          orderBy: { eloAtEntry: 'desc' },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    if (tournament.status !== 'REGISTRATION_OPEN') {
      return NextResponse.json(
        { error: "Tournament cannot be started" },
        { status: 400 }
      );
    }

    if (tournament.participants.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 participants to start tournament" },
        { status: 400 }
      );
    }

    // Generate bracket slots
    const participants = tournament.participants.map(p => ({
      id: p.userId,
      eloAtEntry: p.eloAtEntry,
    }));

    const bracketSlots = generateBracket(participants, tournament.format);

    // Create bracket slots in database
    const createdSlots = await prisma.$transaction(
      bracketSlots.map((slot, index) =>
        prisma.tournamentBracket.create({
          data: {
            tournamentId: id,
            round: slot.round,
            position: slot.matchNumber,
            player1Id: slot.player1Id,
            player2Id: slot.player2Id,
            isBye: !slot.player1Id || !slot.player2Id,
            winnerAdvancesTo: slot.round + 1,
          },
        })
      )
    );

    // Update tournament status
    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
      },
      include: {
        brackets: {
          orderBy: [{ round: 'asc' }, { position: 'asc' }],
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, image: true, foreverElo: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      tournament: updatedTournament,
      bracketSlots: bracketSlots,
      message: `Tournament started with bracket generated`,
    });
  } catch (error) {
    console.error("Error starting tournament:", error);
    return NextResponse.json(
      { error: "Failed to start tournament" },
      { status: 500 }
    );
  }
}
