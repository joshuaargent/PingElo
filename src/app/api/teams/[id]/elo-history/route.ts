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
    
    // Pagination params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const perPage = Math.min(50, Math.max(5, parseInt(searchParams.get('perPage') || '20')));
    const cursor = searchParams.get('cursor');
    
    // Timeframe filter
    const timeframe = searchParams.get('timeframe') || 'all'; // week, month, season, all

    // Calculate date range based on timeframe
    const now = new Date();
    let dateFrom: Date | undefined;
    
    switch (timeframe) {
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'season':
        // Get current season start
        const currentSeason = await prisma.season.findFirst({
          where: { isActive: true },
          orderBy: { startDate: 'desc' },
        });
        if (currentSeason) {
          dateFrom = new Date(currentSeason.startDate);
        }
        break;
      case 'all':
      default:
        dateFrom = undefined;
    }

    // Build where clause
    const whereClause: any = { teamId: id };
    if (dateFrom) {
      whereClause.createdAt = { gte: dateFrom };
    }

    // Get all for stats calculation
    const allHistory = await prisma.teamEloHistory.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
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
    const totalMatches = allHistory.length;
    const wins = allHistory.filter(h => h.change > 0).length;
    const losses = allHistory.filter(h => h.change < 0).length;
    const netChange = allHistory.reduce((sum, h) => sum + h.change, 0);
    
    const eloValues = allHistory.map(h => h.eloAfter);
    const highestElo = eloValues.length > 0 ? Math.max(...eloValues) : 0;
    const lowestElo = eloValues.length > 0 ? Math.min(...eloValues) : 0;

    // Paginated query
    const paginatedHistory = await prisma.teamEloHistory.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: perPage + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
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

    let nextCursor: string | undefined;
    if (paginatedHistory.length > perPage) {
      const nextItem = paginatedHistory.pop();
      nextCursor = nextItem?.id;
    }

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
      history: paginatedHistory.reverse(), // Oldest first for charts
      stats: {
        totalMatches,
        wins,
        losses,
        netChange,
        highestElo,
        lowestElo,
        winRate: totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0,
      },
      pagination: {
        page,
        perPage,
        hasMore: !!nextCursor,
        nextCursor,
      },
    });
  } catch (error) {
    console.error('Error fetching team ELO history:', error);
    return NextResponse.json({ error: 'Failed to fetch team ELO history' }, { status: 500 });
  }
}
