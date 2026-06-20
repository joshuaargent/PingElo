/**
 * Tournament Start API Route
 * Generates bracket and starts the tournament
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionOrForbidden } from "@/lib/auth-actions";

interface BracketSlot {
  round: number;
  position: number;
  player1Id?: string;
  player2Id?: string;
  bracketType?: string;
}

/**
 * Generate bracket matchups based on format
 */
function generateBracket(participants: { id: string; eloAtEntry: number }[], format: string): BracketSlot[] {
  const bracketSlots: BracketSlot[] = [];
  
  // Shuffle participants randomly for first round
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  const numPlayers = shuffled.length;
  
  if (format === 'SINGLE_ELIMINATION') {
    const numRounds = Math.ceil(Math.log2(numPlayers));
    const bracketSize = Math.pow(2, numRounds);
    
    // Generate first round matches
    let position = 1;
    for (let i = 0; i < bracketSize; i += 2) {
      if (i + 1 < numPlayers) {
        bracketSlots.push({
          round: 1,
          position: position++,
          player1Id: shuffled[i].id,
          player2Id: shuffled[i + 1].id,
        });
      } else {
        // Bye - player auto-advances
        bracketSlots.push({
          round: 1,
          position: position++,
          player1Id: shuffled[i].id,
        });
      }
    }
    
    // Generate subsequent rounds
    for (let round = 2; round <= numRounds; round++) {
      const matchesInRound = bracketSize / Math.pow(2, round);
      for (let i = 0; i < matchesInRound; i++) {
        bracketSlots.push({
          round,
          position: i + 1,
        });
      }
    }
  } else if (format === 'DOUBLE_ELIMINATION') {
    const numRounds = Math.ceil(Math.log2(numPlayers));
    const bracketSize = Math.pow(2, numRounds);
    
    // Winner bracket - same as single elimination
    let position = 1;
    for (let i = 0; i < bracketSize; i += 2) {
      if (i + 1 < numPlayers) {
        bracketSlots.push({
          round: 1,
          position: position++,
          player1Id: shuffled[i].id,
          player2Id: shuffled[i + 1].id,
          bracketType: 'winner',
        });
      } else {
        bracketSlots.push({
          round: 1,
          position: position++,
          player1Id: shuffled[i].id,
          bracketType: 'winner',
        });
      }
    }
    
    for (let round = 2; round <= numRounds; round++) {
      const matchesInRound = bracketSize / Math.pow(2, round);
      for (let i = 0; i < matchesInRound; i++) {
        bracketSlots.push({
          round,
          position: i + 1,
          bracketType: 'winner',
        });
      }
    }
    
    // Loser bracket
    const loserRounds = (numRounds - 1) * 2;
    for (let round = 1; round <= loserRounds; round++) {
      const matchesInRound = Math.ceil(bracketSize / Math.pow(2, Math.ceil(round / 2)));
      for (let i = 0; i < matchesInRound; i++) {
        bracketSlots.push({
          round: numRounds + round,
          position: i + 1,
          bracketType: 'loser',
        });
      }
    }
    
    // Grand finals
    bracketSlots.push({
      round: numRounds * 2 + 2,
      position: 1,
      bracketType: 'grand_final',
    });
  } else if (format === 'ROUND_ROBIN') {
    // Everyone plays everyone - all in round 1
    for (let i = 0; i < shuffled.length; i++) {
      for (let j = i + 1; j < shuffled.length; j++) {
        bracketSlots.push({
          round: 1,
          position: bracketSlots.length + 1,
          player1Id: shuffled[i].id,
          player2Id: shuffled[j].id,
        });
      }
    }
  } else if (format === 'SWISS') {
    // Swiss format - start with first round, standings-based pairing later
    const numRounds = Math.ceil(Math.log2(numPlayers)) + 2; // More rounds than typical
    
    // First round - random pairings
    let position = 1;
    const halfSize = Math.ceil(numPlayers / 2);
    const firstHalf = shuffled.slice(0, halfSize);
    const secondHalf = shuffled.slice(halfSize).reverse();
    
    for (let i = 0; i < halfSize; i++) {
      if (firstHalf[i] && secondHalf[i]) {
        bracketSlots.push({
          round: 1,
          position: position++,
          player1Id: firstHalf[i].id,
          player2Id: secondHalf[i].id,
        });
      } else if (firstHalf[i]) {
        // Bye
        bracketSlots.push({
          round: 1,
          position: position++,
          player1Id: firstHalf[i].id,
        });
      }
    }
    
    // Generate subsequent round placeholders (pairings determined dynamically)
    for (let round = 2; round <= numRounds; round++) {
      bracketSlots.push({
        round,
        position: 0, // 0 means not yet paired
      });
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
            team: {
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

    // Validate minimum participants based on match type
    if (tournament.matchType === 'DOUBLES') {
      // For doubles, participants are teams, need at least 2 teams
      if (tournament.participants.length < 2) {
        return NextResponse.json(
          { error: "Doubles tournaments require at least 2 teams" },
          { status: 400 }
        );
      }
    }

    // For single elimination, validate power of 2 participants
    if (tournament.format === 'SINGLE_ELIMINATION') {
      const n = tournament.participants.length;
      if (n < 4) {
        return NextResponse.json(
          { error: "Single elimination requires at least 4 participants" },
          { status: 400 }
        );
      }
      // Check if power of 2
      if (Math.log2(n) !== Math.floor(Math.log2(n))) {
        // Allow non-power-of-2 with byes
        console.log(`Starting with ${n} participants (byes will be assigned)`);
      }
    }

    if (tournament.format === 'DOUBLE_ELIMINATION' && tournament.participants.length < 4) {
      return NextResponse.json(
        { error: "Double elimination requires at least 4 participants" },
        { status: 400 }
      );
    }

    if (tournament.format === 'ROUND_ROBIN' && tournament.participants.length < 3) {
      return NextResponse.json(
        { error: "Round robin requires at least 3 participants" },
        { status: 400 }
      );
    }

    if (tournament.format === 'SWISS' && tournament.participants.length < 4) {
      return NextResponse.json(
        { error: "Swiss format requires at least 4 participants" },
        { status: 400 }
      );
    }

    // Generate bracket slots (handle both singles and doubles)
    const isDoubles = tournament.matchType === 'DOUBLES';
    const participants = tournament.participants.map(p => ({
      id: isDoubles ? (p.teamId || '') : (p.userId || ''), // Use userId for singles, teamId for doubles
      eloAtEntry: p.eloAtEntry,
    }));

    const bracketSlots = generateBracket(participants, tournament.format);

    // Create bracket slots in database
    const createdSlots = await prisma.$transaction(
      bracketSlots.map((slot) =>
        prisma.tournamentBracket.create({
          data: {
            tournamentId: id,
            round: slot.round,
            position: slot.position,
            player1Id: slot.player1Id,
            player2Id: slot.player2Id,
            bracketType: slot.bracketType || 'winner',
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
            team: {
              include: {
                player1: { select: { id: true, name: true, image: true } },
                player2: { select: { id: true, name: true, image: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      tournament: updatedTournament,
      bracketSlots: bracketSlots,
      message: `Tournament started with ${tournament.format.replace('_', ' ')} bracket`,
    });
  } catch (error) {
    console.error("Error starting tournament:", error);
    return NextResponse.json(
      { error: "Failed to start tournament" },
      { status: 500 }
    );
  }
}
