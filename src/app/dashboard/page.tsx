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
import { SeasonCountdownWidget } from '@/components/ui/SeasonCountdownWidget';
import { TopClimberWidget } from '@/components/ui/TopClimberWidget';
import { ActivityFeed } from '@/components/ui/ActivityFeed';
import { ChallengeCard } from '@/components/ui/ChallengeCard';

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
  Users,
  Swords
} from 'lucide-react';

// ============================================
// Dashboard Page
// ============================================

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [userStats, setUserStats] = useState<any>(null);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      redirect('/auth/signin');
    }
    
    // Get current week key
    function getWeekKey(): string {
      const now = new Date();
      const year = now.getFullYear();
      const oneJan = new Date(year, 0, 1);
      const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
      return `${year}-W${weekNumber}`;
    }
    
    // Check if user has seen this week's intro (redirect to weekly page if not)
    async function checkWeeklyIntro() {
      try {
        const currentWeekKey = getWeekKey();
        const lastSeenWeek = localStorage.getItem('lastSeenWeek');
        
        // Redirect to weekly page if user hasn't seen this week yet
        if (lastSeenWeek !== currentWeekKey) {
          window.location.href = '/weekly-reset';
        } else {
          // Check season intro after weekly
          const res = await fetch('/api/seasons/current');
          if (res.ok) {
            const data = await res.json();
            const currentSeasonName = data.season?.name || 'Current Season';
            const lastSeenSeason = localStorage.getItem('lastSeenSeason');
            
            // Redirect to season page if user hasn't seen this season yet
            if (lastSeenSeason !== currentSeasonName) {
              window.location.href = '/season-reset';
            }
          }
        }
      } catch (error) {
        console.error('Failed to check weekly:', error);
      }
    }
    
    checkWeeklyIntro();
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

        // Fetch pending challenges
        const challengesRes = await fetch('/api/challenges?status=PENDING');
        if (challengesRes.ok) {
          const challengesData = await challengesRes.json();
          setChallenges(challengesData.challenges || []);
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

        {/* Widgets Row */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <SeasonCountdownWidget />
          <TopClimberWidget currentUserId={session.user.id} />
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Swords className="h-5 w-5 text-accent" />
                Challenges
              </h3>
              <Link href="/challenges">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            {challenges.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {challenges.slice(0, 2).map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    currentUserId={session.user.id}
                    onUpdate={() => {
                      // Refresh challenges
                      fetch('/api/challenges?status=PENDING')
                        .then(res => res.json())
                        .then(data => setChallenges(data.challenges || []));
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary text-center py-4">
                No pending challenges
              </p>
            )}
          </Card>
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

              {/* Streak */}
              <div className="p-4 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl border border-orange-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-text-secondary">Daily Streak</span>
                  </div>
                  <span className="text-lg font-bold text-orange-500">{stats.currentStreak} days</span>
                </div>
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>Best: {stats.bestStreak} days</span>
                  {stats.currentStreak >= 3 && stats.currentStreak < 7 && (
                    <span className="text-green-500 font-medium">+1 ELO/match (max +5/day)</span>
                  )}
                  {stats.currentStreak >= 7 && stats.currentStreak < 14 && (
                    <span className="text-green-500 font-medium">+2 ELO/match (max +10/day)</span>
                  )}
                  {stats.currentStreak >= 14 && stats.currentStreak < 30 && (
                    <span className="text-green-500 font-medium">+3 ELO/match (max +15/day)</span>
                  )}
                  {stats.currentStreak >= 30 && (
                    <span className="text-green-500 font-medium">+5 ELO/match (max +25/day!)</span>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-bg-secondary rounded-xl">
                  <div className="text-xl sm:text-2xl font-bold text-text-primary">{stats.matchesPlayed}</div>
                  <div className="text-sm text-text-secondary">Matches</div>
                </div>
                <div className="p-3 bg-bg-secondary rounded-xl">
                  <div className="text-xl sm:text-2xl font-bold text-green-500">{stats.wins}</div>
                  <div className="text-sm text-text-secondary">Wins</div>
                </div>
                <div className="p-3 bg-bg-secondary rounded-xl">
                  <div className="text-xl sm:text-2xl font-bold text-red-500">{stats.losses}</div>
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

          {/* Activity Feed */}
          <ActivityFeed limit={5} title="Recent Activity" />
        </div>
      </div>
    </>
  );
}
