'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EloBadge } from '@/components/elo/EloBadge';
import { MatchCardFromMatch } from '@/components/elo/MatchCard';
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  Calendar,
  Flame,
  Clock,
  Settings,
  ArrowLeft,
  Crown
} from 'lucide-react';

// ============================================
// Player Profile Page
// ============================================

const mockPlayer = {
  id: '1',
  name: 'Alex Chen',
  email: 'alex@example.com',
  image: null,
  foreverElo: 1285,
  seasonElo: 1250,
  matchesPlayed: 45,
  wins: 32,
  losses: 13,
  winRate: 71.1,
  currentStreak: 3,
  bestStreak: 7,
  rank: 1,
  isRusty: false,
  isActive: true,
  createdAt: new Date('2024-01-15'),
  lastMatchDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
};

const mockRecentMatches = [
  {
    id: '1',
    player1: { id: '1', name: 'Alex Chen', image: null },
    player2: { id: '2', name: 'Sarah Miller', image: null },
    player1Score: 21,
    player2Score: 18,
    winnerId: '1',
    isTournament: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    eloChange: { player1Change: 12, player2Change: -12 },
  },
  {
    id: '2',
    player1: { id: '1', name: 'Alex Chen', image: null },
    player2: { id: '3', name: 'Mike Johnson', image: null },
    player1Score: 21,
    player2Score: 15,
    winnerId: '1',
    isTournament: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    eloChange: { player1Change: 16, player2Change: -16 },
  },
  {
    id: '3',
    player1: { id: '1', name: 'Alex Chen', image: null },
    player2: { id: '4', name: 'Emma Wilson', image: null },
    player1Score: 18,
    player2Score: 21,
    winnerId: '4',
    isTournament: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    eloChange: { player1Change: -24, player2Change: 24 },
  },
];

export default function PlayerProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const isOwnProfile = session?.user?.id === params.id || !params.id;

  const player = mockPlayer;

  return (
    <>
      {/* Hero Section - Consistent with homepage styling */}
      <section className="relative overflow-hidden py-12 md:py-16">
        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="container">
          <div className="mx-auto max-w-4xl">
            {/* Back Button */}
            <Link href="/leaderboard" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to Leaderboard
            </Link>

            {/* Profile Header */}
            <Card className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar
                  src={player.image}
                  alt={player.name}
                  fallback={player.name.charAt(0)}
                  size="xl"
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-text-primary">
                      {player.name}
                    </h1>
                    {player.isActive && (
                      <Badge variant="success" size="sm">Active</Badge>
                    )}
                    {player.isRusty && (
                      <Badge variant="warning" size="sm">Rusty</Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      Rank #{player.rank}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {player.winRate}% win rate
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {player.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {isOwnProfile && (
                  <Link href="/settings">
                    <Button variant="outline" leftIcon={<Settings className="h-4 w-4" />}>
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </div>
            </Card>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-accent flex items-center justify-center gap-2 text-2xl font-bold md:text-3xl">
                  <TrendingUp className="h-6 w-6" />
                  <span>{player.foreverElo}</span>
                </div>
                <p className="text-text-secondary mt-1 text-sm">Forever ELO</p>
              </div>
              <div className="text-center">
                <div className="text-accent flex items-center justify-center gap-2 text-2xl font-bold md:text-3xl">
                  <Trophy className="h-6 w-6" />
                  <span>#{player.rank}</span>
                </div>
                <p className="text-text-secondary mt-1 text-sm">Current Rank</p>
              </div>
              <div className="text-center">
                <div className="text-accent flex items-center justify-center gap-2 text-2xl font-bold md:text-3xl">
                  <Crown className="h-6 w-6" />
                  <span>{player.winRate}%</span>
                </div>
                <p className="text-text-secondary mt-1 text-sm">Win Rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <div className="container mx-auto px-4 pb-16">
        {/* ELO Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Forever ELO
            </h2>
            <Badge variant="accent">Lifetime</Badge>
          </div>
          <div className="flex items-end gap-4 mb-4">
            <span className="text-5xl font-bold text-text-primary">
              {player.foreverElo}
            </span>
            <EloBadge elo={player.foreverElo} size="lg" />
          </div>
          <div className="flex items-center gap-6 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              #{player.rank} All-Time
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Season ELO
            </h2>
            <Badge variant="primary">This Month</Badge>
          </div>
          <div className="flex items-end gap-4 mb-4">
            <span className="text-5xl font-bold text-text-primary">
              {player.seasonElo}
            </span>
            <EloBadge elo={player.seasonElo} size="lg" />
          </div>
          <div className="flex items-center gap-6 text-sm text-text-secondary">
            {player.currentStreak > 0 && (
              <span className="flex items-center gap-1">
                <Flame className="h-4 w-4 text-orange-500" />
                {player.currentStreak} win streak
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Match Stats */}
      <Card className="p-6 mb-8">
        <h2 className="font-semibold text-text-primary mb-6 flex items-center gap-2">
          <Target className="h-5 w-5 text-accent" />
          Match Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-bg-secondary rounded-xl">
            <div className="text-3xl font-bold text-text-primary mb-1">
              {player.matchesPlayed}
            </div>
            <div className="text-sm text-text-secondary">Matches</div>
          </div>
          <div className="text-center p-4 bg-green-500/5 rounded-xl">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {player.wins}
            </div>
            <div className="text-sm text-text-secondary">Wins</div>
          </div>
          <div className="text-center p-4 bg-red-500/5 rounded-xl">
            <div className="text-3xl font-bold text-red-600 mb-1">
              {player.losses}
            </div>
            <div className="text-sm text-text-secondary">Losses</div>
          </div>
          <div className="text-center p-4 bg-bg-secondary rounded-xl">
            <div className="text-3xl font-bold text-text-primary mb-1">
              {player.winRate}%
            </div>
            <div className="text-sm text-text-secondary">Win Rate</div>
          </div>
          <div className="text-center p-4 bg-bg-secondary rounded-xl">
            <div className="text-3xl font-bold text-text-primary mb-1">
              {player.bestStreak}
            </div>
            <div className="text-sm text-text-secondary">Best Streak</div>
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
          <Link href={`/matches/history${isOwnProfile ? '' : `?player=${params.id}`}`}>
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        <div className="space-y-4">
          {mockRecentMatches.map((match) => (
            <MatchCardFromMatch key={match.id} match={match} />
          ))}
        </div>
      </Card>
      </div>
    </>
  );
}
