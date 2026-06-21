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

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type') || 'singles'; // singles, doubles, team

    // Get user's ELO history based on type
    let eloHistory: any[] = [];
    let stats = {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      netChange: 0,
      highestElo: 0,
      lowestElo: 0,
      winRate: 0,
    };

    if (type === 'team') {
      // Get all teams the user belongs to
      const teams = await prisma.team.findMany({
        where: {
          OR: [
            { player1Id: id },
            { player2Id: id },
          ],
        },
        select: { id: true },
      });
      
      const teamIds = teams.map(t => t.id);
      
      if (teamIds.length > 0) {
        eloHistory = await prisma.teamEloHistory.findMany({
          where: { teamId: { in: teamIds } },
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            eloBefore: true,
            eloAfter: true,
            change: true,
            changeType: true,
            description: true,
            createdAt: true,
            teamId: true,
          },
        });
        
        const wins = eloHistory.filter(h => h.change > 0).length;
        const losses = eloHistory.filter(h => h.change < 0).length;
        const netChange = eloHistory.reduce((sum, h) => sum + h.change, 0);
        const eloValues = eloHistory.map(h => h.eloAfter);
        
        stats = {
          totalMatches: eloHistory.length,
          wins,
          losses,
          netChange,
          highestElo: eloValues.length > 0 ? Math.max(...eloValues) : 0,
          lowestElo: eloValues.length > 0 ? Math.min(...eloValues) : 0,
          winRate: eloHistory.length > 0 ? Math.round((wins / eloHistory.length) * 100) : 0,
        };
      } else {
        eloHistory = [];
      }
    } else {
      eloHistory = await prisma.eloHistory.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          eloBefore: true,
          eloAfter: true,
          change: true,
          changeType: true,
          description: true,
          createdAt: true,
        },
      });

      const wins = eloHistory.filter(h => h.change > 0).length;
      const losses = eloHistory.filter(h => h.change < 0).length;
      const netChange = eloHistory.reduce((sum, h) => sum + h.change, 0);
      const eloValues = eloHistory.map(h => h.eloAfter);
      
      stats = {
        totalMatches: eloHistory.length,
        wins,
        losses,
        netChange,
        highestElo: eloValues.length > 0 ? Math.max(...eloValues) : 0,
        lowestElo: eloValues.length > 0 ? Math.min(...eloValues) : 0,
        winRate: eloHistory.length > 0 ? Math.round((wins / eloHistory.length) * 100) : 0,
      };
    }

    return NextResponse.json({
      history: eloHistory.reverse(), // Oldest first for charts
      stats,
    });
  } catch (error) {
    console.error('Error fetching ELO history:', error);
    return NextResponse.json({ error: 'Failed to fetch ELO history' }, { status: 500 });
  }
}
