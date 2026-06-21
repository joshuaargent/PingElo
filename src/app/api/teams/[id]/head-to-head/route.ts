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

    const { id: team1Id } = await params;
    const { searchParams } = new URL(request.url);
    const team2Id = searchParams.get('opponentId');

    if (!team2Id) {
      return NextResponse.json({ error: 'Opponent team ID required' }, { status: 400 });
    }

    // Get player IDs for both teams first
    const [team1Data, team2Data] = await Promise.all([
      prisma.team.findUnique({
        where: { id: team1Id },
        select: { player1Id: true, player2Id: true },
      }),
      prisma.team.findUnique({
        where: { id: team2Id },
        select: { player1Id: true, player2Id: true },
      }),
    ]);

    if (!team1Data || !team2Data) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const team1PlayerIds = [team1Data.player1Id, team1Data.player2Id].filter(Boolean) as string[];
    const team2PlayerIds = [team2Data.player1Id, team2Data.player2Id].filter(Boolean) as string[];

    // Get all matches where both teams' players are involved
    const matches = await prisma.match.findMany({
      where: {
        matchType: 'DOUBLES',
        OR: [
          // team1 on side 1, team2 on side 2
          { 
            team1Player1Id: { in: team1PlayerIds },
            team2Player1Id: { in: team2PlayerIds },
          },
          // team2 on side 1, team1 on side 2
          { 
            team1Player1Id: { in: team2PlayerIds },
            team2Player1Id: { in: team1PlayerIds },
          },
        ],
      },
      include: {
        team1Player1: { select: { id: true, name: true } },
        team1Player2: { select: { id: true, name: true } },
        team2Player1: { select: { id: true, name: true } },
        team2Player2: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get team info
    const team1 = await prisma.team.findUnique({
      where: { id: team1Id },
      select: { id: true, name: true, player1: { select: { id: true, name: true } }, player2: { select: { id: true, name: true } } },
    });

    const team2 = await prisma.team.findUnique({
      where: { id: team2Id },
      select: { id: true, name: true, player1: { select: { id: true, name: true } }, player2: { select: { id: true, name: true } } },
    });

    // Calculate stats
    let team1Wins = 0;
    let team2Wins = 0;
    let team1TotalScore = 0;
    let team2TotalScore = 0;

    const processedMatches = matches.map(match => {
      // Determine which side has team1
      const isTeam1OnSide1 = match.team1Player1Id && team1PlayerIds.includes(match.team1Player1Id);
      
      const t1Score = isTeam1OnSide1 ? match.player1Score : match.player2Score;
      const t2Score = isTeam1OnSide1 ? match.player2Score : match.player1Score;
      
      // Winner is the first player's ID on the winning side
      const winnerOnSide1 = match.winnerId === match.team1Player1Id;
      const team1Won = isTeam1OnSide1 ? winnerOnSide1 : !winnerOnSide1;
      
      if (team1Won) team1Wins++;
      else team2Wins++;
      
      team1TotalScore += t1Score;
      team2TotalScore += t2Score;
      
      return {
        id: match.id,
        date: match.createdAt,
        team1Score: t1Score,
        team2Score: t2Score,
        team1Won,
        players: isTeam1OnSide1 ? {
          team1: [match.team1Player1, match.team1Player2],
          team2: [match.team2Player1, match.team2Player2],
        } : {
          team1: [match.team2Player1, match.team2Player2],
          team2: [match.team1Player1, match.team1Player2],
        },
      };
    });

    const totalMatches = matches.length;

    return NextResponse.json({
      teams: { team1, team2 },
      matches: processedMatches,
      stats: {
        totalMatches,
        team1Wins,
        team2Wins,
        team1WinRate: totalMatches > 0 ? Math.round((team1Wins / totalMatches) * 100) : 0,
        team2WinRate: totalMatches > 0 ? Math.round((team2Wins / totalMatches) * 100) : 0,
        team1AvgScore: totalMatches > 0 ? Math.round(team1TotalScore / totalMatches * 10) / 10 : 0,
        team2AvgScore: totalMatches > 0 ? Math.round(team2TotalScore / totalMatches * 10) / 10 : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching team head-to-head:', error);
    return NextResponse.json({ error: 'Failed to fetch team head-to-head stats' }, { status: 500 });
  }
}
