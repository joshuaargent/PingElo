'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EloBadge } from '@/components/elo/EloBadge';
import { MatchCardFromMatch } from '@/components/elo/MatchCard';
import { 
  TrendingUp, 
  Trophy, 
  Plus, 
  Target, 
  Flame, 
  Clock,
  ArrowRight,
  Zap,
  Calendar,
  Users
} from 'lucide-react';

// ============================================
// Dashboard Page
// ============================================

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [userStats, setUserStats] = useState<any>(null);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      redirect('/auth/signin');
    }
    
    // Check if user has seen this season's intro
    async function checkSeason() {
      try {
        const res = await fetch('/api/seasons/current');
        if (res.ok) {
          const data = await res.json();
          const currentSeasonName = data.season?.name || 'Current Season';
          const lastSeenSeason = localStorage.getItem('lastSeenSeason');
          
          // Show season intro if:
          // 1. Season needs reset (old season ended), OR
          // 2. User hasn't seen this season yet
          if (data.needsReset || lastSeenSeason !== currentSeasonName) {
            redirect('/season-reset');
          }
        }
      } catch (error) {
        console.error('Failed to check season:', error);
      }
    }
    
    checkSeason();
  }, [session, status]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!session?.user?.id) return;
      
      setIsLoading(true);
      try {
        // Fetch user stats
        const userRes = await fetch(`/api/users/${session.user.id}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserStats(userData.user);
        }

        // Fetch recent matches for this user
        const matchesRes = await fetch(`/api/matches?userId=${session.user.id}&limit=5`);
        if (matchesRes.ok) {
          const matchesData = await matchesRes.json();
          setRecentMatches(matchesData.matches || []);
        }

        // Fetch upcoming tournaments
        const tournamentsRes = await fetch('/api/tournaments?status=REGISTRATION_OPEN');
        if (tournamentsRes.ok) {
          const tournamentsData = await tournamentsRes.json();
          setUpcomingTournaments(tournamentsData.tournaments || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (session?.user?.id) {
      fetchDashboardData();
    }
  }, [session?.user?.id]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const userName = session.user.name || 'Player';
  const stats = userStats || {
    foreverElo: 1000,
    seasonElo: 1000,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    rank: '-',
    currentStreak: 0,
    bestStreak: 0,
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            {/* Title */}
            <h1 className="text-text-primary text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Welcome back, {userName.split(' ')[0]}! 👋
            </h1>

            {/* Subtitle */}
            <p className="text-text-secondary mx-auto mt-4 max-w-2xl text-lg md:text-xl">
              Ready for some ping pong?
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <div className="container mx-auto px-4 pb-16">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href="/matches/new">
            <Card className="p-4 text-center hover:border-accent transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Plus className="h-6 w-6 text-accent" />
              </div>
              <p className="text-sm font-medium text-text-primary">Log Match</p>
            </Card>
          </Link>
          <Link href="/leaderboard">
            <Card className="p-4 text-center hover:border-accent transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="h-6 w-6 text-accent" />
              </div>
              <p className="text-sm font-medium text-text-primary">Leaderboard</p>
            </Card>
          </Link>
          <Link href="/tournaments">
            <Card className="p-4 text-center hover:border-accent transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <p className="text-sm font-medium text-text-primary">Tournaments</p>
            </Card>
          </Link>
          <Link href="/matches/history">
            <Card className="p-4 text-center hover:border-accent transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <p className="text-sm font-medium text-text-primary">Match History</p>
            </Card>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Your Stats */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Your Stats
              </h2>
              <Link href={`/profile/${session.user.id}`}>
                <Button variant="ghost" size="sm">View Profile</Button>
              </Link>
            </div>
            
            <div className="space-y-6">
              {/* Forever ELO */}
              <div className="p-4 bg-bg-secondary rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary">Forever ELO</span>
                  <EloBadge elo={stats.foreverElo} size="md" />
                </div>
                <div className="flex items-center justify-between text-sm text-text-secondary">
                  <span>Rank #{stats.rank}</span>
                  <span>{stats.winRate}% win rate</span>
                </div>
              </div>

              {/* Season ELO */}
              <div className="p-4 bg-bg-secondary rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary">Season ELO</span>
                  <EloBadge elo={stats.seasonElo} size="md" />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-bg-secondary rounded-xl">
                  <div className="text-2xl font-bold text-text-primary">{stats.matchesPlayed}</div>
                  <div className="text-sm text-text-secondary">Matches</div>
                </div>
                <div className="p-3 bg-bg-secondary rounded-xl">
                  <div className="text-2xl font-bold text-green-500">{stats.wins}</div>
                  <div className="text-sm text-text-secondary">Wins</div>
                </div>
                <div className="p-3 bg-bg-secondary rounded-xl">
                  <div className="text-2xl font-bold text-red-500">{stats.losses}</div>
                  <div className="text-sm text-text-secondary">Losses</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Matches */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                Recent Matches
              </h2>
              <Link href="/matches/history">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            
            {recentMatches.length > 0 ? (
              <div className="space-y-4">
                {recentMatches.slice(0, 3).map((match) => (
                  <MatchCardFromMatch key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No matches yet</p>
                <Link href="/matches/new">
                  <Button variant="outline" className="mt-4" size="sm">
                    Log Your First Match
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Upcoming Tournaments */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                Upcoming Tournaments
              </h2>
              <Link href="/tournaments">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            
            {upcomingTournaments.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {upcomingTournaments.slice(0, 2).map((tournament) => (
                  <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
                    <div className="p-4 bg-bg-secondary rounded-xl hover:bg-bg-secondary/80 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-text-primary">{tournament.name}</h3>
                        <Badge variant="success" size="sm">Open</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-text-secondary">
                        <span>{tournament.participantCount}/{tournament.maxParticipants} players</span>
                        <span>Prize: {tournament.prizePool} ELO</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No upcoming tournaments</p>
                <Link href="/tournaments">
                  <Button variant="outline" className="mt-4" size="sm">
                    Browse Tournaments
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
