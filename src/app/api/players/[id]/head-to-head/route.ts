import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: player1Id } = await params;
    const { searchParams } = new URL(request.url);
    const player2Id = searchParams.get('opponentId');

    if (!player2Id) {
      return NextResponse.json({ error: 'Opponent ID required' }, { status: 400 });
    }

    // Get all matches between these two players
    const matches = await prisma.match.findMany({
      where: {
        matchType: 'SINGLES',
        OR: [
          { player1Id, player2Id },
          { player1Id: player2Id, player2Id: player1Id },
        ],
      },
      include: {
        player1: {
          select: { id: true, name: true, image: true },
        },
        player2: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats
    let player1Wins = 0;
    let player2Wins = 0;
    let player1TotalScore = 0;
    let player2TotalScore = 0;
    let largestUpset = { winner: '', loser: '', eloDiff: 0, match: null as any };

    for (const match of matches) {
      const isPlayer1 = match.player1Id === player1Id;
      const player1Score = isPlayer1 ? match.player1Score : match.player2Score;
      const player2Score = isPlayer1 ? match.player2Score : match.player1Score;

      player1TotalScore += player1Score;
      player2TotalScore += player2Score;

      if (match.winnerId === player1Id) {
        player1Wins++;
      } else {
        player2Wins++;
      }

      // Check for upset (winner was lower ELO)
      const winnerElo = isPlayer1 ? match.player1EloBefore : match.player2EloBefore;
      const loserElo = isPlayer1 ? match.player2EloBefore : match.player1EloBefore;
      if (winnerElo && loserElo && loserElo > winnerElo) {
        const eloDiff = loserElo - winnerElo;
        if (eloDiff > largestUpset.eloDiff) {
          largestUpset = {
            winner: isPlayer1 ? (match.player1?.name || 'Unknown') : (match.player2?.name || 'Unknown'),
            loser: isPlayer1 ? (match.player2?.name || 'Unknown') : (match.player1?.name || 'Unknown'),
            eloDiff,
            match: {
              id: match.id,
              date: match.createdAt,
              score: `${player1Score}-${player2Score}`,
            },
          };
        }
      }
    }

    const totalMatches = matches.length;
    const stats = {
      totalMatches,
      player1Wins,
      player2Wins,
      player1WinRate: totalMatches > 0 ? Math.round((player1Wins / totalMatches) * 100) : 0,
      player2WinRate: totalMatches > 0 ? Math.round((player2Wins / totalMatches) * 100) : 0,
      player1AvgScore: totalMatches > 0 ? Math.round(player1TotalScore / totalMatches * 10) / 10 : 0,
      player2AvgScore: totalMatches > 0 ? Math.round(player2TotalScore / totalMatches * 10) / 10 : 0,
      largestUpset: largestUpset.eloDiff > 0 ? largestUpset : null,
    };

    // Get player info
    const player1 = await prisma.user.findUnique({
      where: { id: player1Id },
      select: { id: true, name: true, image: true, foreverElo: true },
    });

    const player2 = await prisma.user.findUnique({
      where: { id: player2Id },
      select: { id: true, name: true, image: true, foreverElo: true },
    });

    return NextResponse.json({
      players: { player1, player2 },
      matches: matches.map(m => ({
        id: m.id,
        date: m.createdAt,
        player1Score: m.player1Id === player1Id ? m.player1Score : m.player2Score,
        player2Score: m.player1Id === player1Id ? m.player2Score : m.player1Score,
        winnerId: m.winnerId,
        player1Id: m.player1Id,
        player2Id: m.player2Id,
      })),
      stats,
    });
  } catch (error) {
    console.error('Error fetching head-to-head:', error);
    return NextResponse.json({ error: 'Failed to fetch head-to-head stats' }, { status: 500 });
  }
}
