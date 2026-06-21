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
    const cursor = searchParams.get('cursor'); // ISO date string for cursor pagination
    
    // Timeframe filter
    const timeframe = searchParams.get('timeframe') || 'all'; // week, month, season, all
    const type = searchParams.get('type') || 'singles'; // singles, doubles, team

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
    const whereClause: any = {};
    if (dateFrom) {
      whereClause.createdAt = { gte: dateFrom };
    }

    // For stats, we need to query separately
    let stats = {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      netChange: 0,
      highestElo: 0,
      lowestElo: 0,
      winRate: 0,
      timeframeMatches: 0,
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
        const teamWhere = { teamId: { in: teamIds }, ...whereClause };
        
        // Get total count for stats
        const allHistory = await prisma.teamEloHistory.findMany({
          where: teamWhere,
          orderBy: { createdAt: 'desc' },
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
        
        stats.timeframeMatches = allHistory.length;
        const wins = allHistory.filter(h => h.change > 0).length;
        const losses = allHistory.filter(h => h.change < 0).length;
        const eloValues = allHistory.map(h => h.eloAfter);
        
        stats = {
          ...stats,
          totalMatches: allHistory.length,
          wins,
          losses,
          netChange: allHistory.reduce((sum, h) => sum + h.change, 0),
          highestElo: eloValues.length > 0 ? Math.max(...eloValues) : 0,
          lowestElo: eloValues.length > 0 ? Math.min(...eloValues) : 0,
          winRate: allHistory.length > 0 ? Math.round((wins / allHistory.length) * 100) : 0,
        };
        
        // Apply cursor pagination
        const paginatedHistory = await prisma.teamEloHistory.findMany({
          where: teamWhere,
          orderBy: { createdAt: 'desc' },
          take: perPage + 1, // Take one extra to check if there's a next page
          ...(cursor && { skip: 1, cursor: { id: cursor } }),
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
        
        // Determine if there's a next page
        let nextCursor: string | undefined;
        if (paginatedHistory.length > perPage) {
          const nextItem = paginatedHistory.pop();
          nextCursor = nextItem?.id;
        }
        
        return NextResponse.json({
          history: paginatedHistory.reverse(), // Oldest first for charts
          stats,
          pagination: {
            page,
            perPage,
            hasMore: !!nextCursor,
            nextCursor,
          },
        });
      }
      
      return NextResponse.json({
        history: [],
        stats,
        pagination: { page, perPage, hasMore: false, nextCursor: undefined },
      });
    }
    
    // Singles/doubles ELO history
    whereClause.userId = id;
    
    // Get all for stats calculation
    const allHistory = await prisma.eloHistory.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
    
    stats.timeframeMatches = allHistory.length;
    const wins = allHistory.filter(h => h.change > 0).length;
    const losses = allHistory.filter(h => h.change < 0).length;
    const eloValues = allHistory.map(h => h.eloAfter);
    
    stats = {
      ...stats,
      totalMatches: allHistory.length,
      wins,
      losses,
      netChange: allHistory.reduce((sum, h) => sum + h.change, 0),
      highestElo: eloValues.length > 0 ? Math.max(...eloValues) : 0,
      lowestElo: eloValues.length > 0 ? Math.min(...eloValues) : 0,
      winRate: allHistory.length > 0 ? Math.round((wins / allHistory.length) * 100) : 0,
    };
    
    // Paginated query
    const paginatedHistory = await prisma.eloHistory.findMany({
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
    
    return NextResponse.json({
      history: paginatedHistory.reverse(), // Oldest first for charts
      stats,
      pagination: {
        page,
        perPage,
        hasMore: !!nextCursor,
        nextCursor,
      },
    });
  } catch (error) {
    console.error('Error fetching ELO history:', error);
    return NextResponse.json({ error: 'Failed to fetch ELO history' }, { status: 500 });
  }
}
