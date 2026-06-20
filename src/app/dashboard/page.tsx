'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EloBadge } from '@/components/elo/EloBadge';
import { MatchCardFromMatch } from '@/components/elo/MatchCard';
import { 
  TrendingUp, 
  Trophy, 
  Calendar, 
  Plus, 
  Target, 
  Flame, 
  Clock,
  ArrowRight,
  Zap
} from 'lucide-react';

// ============================================
// Dashboard Page
// ============================================

// Mock data - in production this would come from API based on session
const mockStats = {
  foreverElo: 1042,
  seasonElo: 1028,
  matchesPlayed: 23,
  wins: 14,
  losses: 9,
  winRate: 60.9,
  currentStreak: 3,
  bestStreak: 5,
  rank: 12,
};

const mockRecentMatches = [
  {
    id: '1',
    player1: { id: '1', name: 'You', image: null },
    player2: { id: '2', name: 'Alex Chen', image: null },
    player1Score: 21,
    player2Score: 18,
    winnerId: '1',
    isTournament: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    eloChange: { player1Change: 12, player2Change: -12 },
  },
  {
    id: '2',
    player1: { id: '1', name: 'You', image: null },
    player2: { id: '3', name: 'Sarah Miller', image: null },
    player1Score: 15,
    player2Score: 21,
    winnerId: '3',
    isTournament: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    eloChange: { player1Change: -18, player2Change: 18 },
  },
  {
    id: '3',
    player1: { id: '1', name: 'You', image: null },
    player2: { id: '4', name: 'Mike Johnson', image: null },
    player1Score: 21,
    player2Score: 12,
    winnerId: '1',
    isTournament: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    eloChange: { player1Change: 24, player2Change: -24 },
  },
];

const mockUpcomingTournaments = [
  {
    id: '1',
    name: 'Weekly Championship',
    status: 'REGISTRATION_OPEN',
    startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    participants: 5,
    maxParticipants: 8,
    entryFee: 10,
    prizePool: 610,
  },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  const userName = session?.user?.name || 'Player';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Welcome back, {userName.split(' ')[0]}! 👋
        </h1>
        <p className="text-text-secondary">
          Ready for some ping pong?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/matches/new">
          <Card className="p-4 text-center hover:border-accent transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-semibold text-sm">Log Match</h3>
            <p className="text-xs text-text-secondary">Record a game</p>
          </Card>
        </Link>

        <Link href="/leaderboard">
          <Card className="p-4 text-center hover:border-accent transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
            <h3 className="font-semibold text-sm">Leaderboard</h3>
            <p className="text-xs text-text-secondary">View rankings</p>
          </Card>
        </Link>

        <Link href="/tournaments">
          <Card className="p-4 text-center hover:border-accent transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="font-semibold text-sm">Tournaments</h3>
            <p className="text-xs text-text-secondary">Join a tournament</p>
          </Card>
        </Link>

        <Link href={`/profile/${session?.user?.id}`}>
          <Card className="p-4 text-center hover:border-accent transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="font-semibold text-sm">My Profile</h3>
            <p className="text-xs text-text-secondary">View stats</p>
          </Card>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* ELO Stats */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Forever ELO
                </h3>
                <Badge variant="accent">Lifetime</Badge>
              </div>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-4xl font-bold text-text-primary">
                  {mockStats.foreverElo}
                </span>
                <EloBadge elo={mockStats.foreverElo} size="md" />
              </div>
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  Rank #{mockStats.rank}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {mockStats.winRate}% win rate
                </span>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  Season ELO
                </h3>
                <Badge variant="primary">This Month</Badge>
              </div>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-4xl font-bold text-text-primary">
                  {mockStats.seasonElo}
                </span>
                <EloBadge elo={mockStats.seasonElo} size="md" />
              </div>
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  {mockStats.currentStreak} win streak
                </span>
              </div>
            </Card>
          </div>

          {/* Match Stats */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
                Your Stats
              </h3>
              <Link href="/matches/history">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  View All
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-bg-secondary rounded-xl">
                <div className="text-3xl font-bold text-text-primary mb-1">
                  {mockStats.matchesPlayed}
                </div>
                <div className="text-sm text-text-secondary">Matches</div>
              </div>
              <div className="text-center p-4 bg-green-500/5 rounded-xl">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {mockStats.wins}
                </div>
                <div className="text-sm text-text-secondary">Wins</div>
              </div>
              <div className="text-center p-4 bg-red-500/5 rounded-xl">
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {mockStats.losses}
                </div>
                <div className="text-sm text-text-secondary">Losses</div>
              </div>
              <div className="text-center p-4 bg-bg-secondary rounded-xl">
                <div className="text-3xl font-bold text-text-primary mb-1">
                  {mockStats.bestStreak}
                </div>
                <div className="text-sm text-text-secondary">Best Streak</div>
              </div>
            </div>
          </Card>

          {/* Recent Matches */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                Recent Matches
              </h3>
              <Link href="/matches/history">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  View All
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {mockRecentMatches.map((match) => (
                <MatchCardFromMatch key={match.id} match={match} />
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Log Match CTA */}
          <Card className="p-6 bg-gradient-to-br from-accent to-accent-hover">
            <h3 className="text-lg font-semibold text-white mb-2">
              Played a match?
            </h3>
            <p className="text-white/80 text-sm mb-4">
              Log your game and watch your ELO update instantly.
            </p>
            <Link href="/matches/new">
              <Button 
                variant="secondary" 
                className="w-full bg-white text-accent hover:bg-white/90"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Log Match Now
              </Button>
            </Link>
          </Card>

          {/* Upcoming Tournaments */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                Tournaments
              </h3>
              <Link href="/tournaments">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            {mockUpcomingTournaments.length > 0 ? (
              <div className="space-y-3">
                {mockUpcomingTournaments.map((tournament) => (
                  <div 
                    key={tournament.id} 
                    className="p-4 bg-bg-secondary rounded-xl"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-text-primary">
                        {tournament.name}
                      </h4>
                      <Badge variant="success" size="sm">Open</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-text-secondary mb-3">
                      <span>{tournament.participants}/{tournament.maxParticipants} players</span>
                      <span>{tournament.entryFee === 0 ? 'Free' : `${tournament.entryFee} ELO`}</span>
                    </div>
                    <Link href={`/tournaments/${tournament.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Tournament
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-sm text-center py-4">
                No upcoming tournaments. Check back soon!
              </p>
            )}
          </Card>

          {/* Activity */}
          <Card className="p-6">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Stay Active
            </h3>
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/10 rounded-full mb-3">
                <span className="text-2xl font-bold text-orange-500">2</span>
              </div>
              <p className="text-text-secondary text-sm">
                Play <strong>2+ matches this week</strong> to earn an activity bonus!
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
