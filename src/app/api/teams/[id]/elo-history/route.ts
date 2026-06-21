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

    const eloHistory = await prisma.teamEloHistory.findMany({
      where: { teamId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        eloBefore: true,
        eloAfter: true,
        change: true,
        changeType: true,
        description: true,
        metadata: true,
        createdAt: true,
      },
    });

    // Calculate stats
    const totalMatches = eloHistory.length;
    const wins = eloHistory.filter(h => h.change > 0).length;
    const losses = eloHistory.filter(h => h.change < 0).length;
    const netChange = eloHistory.reduce((sum, h) => sum + h.change, 0);
    
    const eloValues = eloHistory.map(h => h.eloAfter);
    const highestElo = eloValues.length > 0 ? Math.max(...eloValues) : 0;
    const lowestElo = eloValues.length > 0 ? Math.min(...eloValues) : 0;

    // Get team info
    const team = await prisma.team.findUnique({
      where: { id },
      select: { 
        id: true, 
        name: true,
        player1: { select: { id: true, name: true } },
        player2: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      team,
      history: eloHistory.reverse(), // Oldest first for charts
      stats: {
        totalMatches,
        wins,
        losses,
        netChange,
        highestElo,
        lowestElo,
        winRate: totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching team ELO history:', error);
    return NextResponse.json({ error: 'Failed to fetch team ELO history' }, { status: 500 });
  }
}
