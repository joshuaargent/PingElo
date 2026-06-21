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

    const eloHistory = await prisma.eloHistory.findMany({
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

    // Calculate stats
    const totalMatches = eloHistory.length;
    const wins = eloHistory.filter(h => h.change > 0).length;
    const losses = eloHistory.filter(h => h.change < 0).length;
    const netChange = eloHistory.reduce((sum, h) => sum + h.change, 0);
    
    // Get highest and lowest ELO from history
    const eloValues = eloHistory.map(h => h.eloAfter);
    const highestElo = eloValues.length > 0 ? Math.max(...eloValues) : 0;
    const lowestElo = eloValues.length > 0 ? Math.min(...eloValues) : 0;

    return NextResponse.json({
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
    console.error('Error fetching ELO history:', error);
    return NextResponse.json({ error: 'Failed to fetch ELO history' }, { status: 500 });
  }
}
