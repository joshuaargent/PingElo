'use client';
import { PageHero } from '@/components/layout/PageHero';

import { useState, useEffect } from 'react';
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
  Medal,
  Users,
  Crown
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  foreverElo: number;
  seasonElo: number;
  doublesForeverElo: number;
  doublesSeasonElo: number;
  matchesPlayed: number;
  doublesMatchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  rank: number;
  currentStreak: number;
  longestStreak: number;
  totalSinglesSeasonWins: number;
  totalDoublesSeasonWins: number;
  totalTeamSeasonWins: number;
  isRusty: boolean;
  isActive: boolean;
  createdAt: string;
}

interface Match {
  id: string;
  matchType: string;
  player1: { id: string; name: string; image?: string | null };
  player2: { id: string; name: string; image?: string | null };
  player1Score: number;
  player2Score: number;
  winnerId: string;
  createdAt: string;
  isTournamentMatch: boolean;
}

// ============================================
// Player Profile Page
// ============================================

export default function ProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isOwnProfile = session?.user?.id === params.id;

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/users/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchMatches() {
      try {
        const res = await fetch(`/api/matches?userId=${params.id}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setRecentMatches(data.matches || []);
        }
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      }
    }

    fetchProfile();
    fetchMatches();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">User Not Found</h1>
        <p className="text-text-secondary mb-8">The profile you're looking for doesn't exist.</p>
        <Link href="/leaderboard">
          <Button>Back to Leaderboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-16">
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
                  src={profile.image}
                  alt={profile.name}
                  fallback={profile.name.charAt(0)}
                  size="xl"
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-xl sm:text-3xl font-bold text-text-primary">
                      {profile.name}
                    </h1>
                    {profile.isActive && (
                      <Badge variant="success" size="sm">Active</Badge>
                    )}
                    {profile.isRusty && (
                      <Badge variant="warning" size="sm">Rusty</Badge>
                    )}
                  </div>
                  
                  {/* Season Win Badges */}
                  {(profile.totalSinglesSeasonWins > 0 || profile.totalDoublesSeasonWins > 0 || profile.totalTeamSeasonWins > 0) && (
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      {profile.totalSinglesSeasonWins > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full text-xs font-medium text-yellow-700 dark:text-yellow-400">
                          <Crown className="h-3 w-3" />
                          {profile.totalSinglesSeasonWins} Singles Season {profile.totalSinglesSeasonWins === 1 ? 'Win' : 'Wins'}
                        </div>
                      )}
                      {profile.totalDoublesSeasonWins > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full text-xs font-medium text-purple-700 dark:text-purple-400">
                          <Medal className="h-3 w-3" />
                          {profile.totalDoublesSeasonWins} Doubles Season {profile.totalDoublesSeasonWins === 1 ? 'Win' : 'Wins'}
                        </div>
                      )}
                      {profile.totalTeamSeasonWins > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-xs font-medium text-blue-700 dark:text-blue-400">
                          <Users className="h-3 w-3" />
                          {profile.totalTeamSeasonWins} Team Season {profile.totalTeamSeasonWins === 1 ? 'Win' : 'Wins'}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      Rank #{profile.rank}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {profile.winRate}% win rate
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {new Date(profile.createdAt).toLocaleDateString()}
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
          </div>
        </div>
      </section>

      {/* Content Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          {/* ELO Stats */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-text-primary flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Forever ELO
                </h2>
                <EloBadge elo={profile.foreverElo} size="md" />
              </div>
              <p className="text-sm text-text-secondary">
                Your all-time ELO rating that never resets
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-text-primary flex items-center gap-2">
                  <Flame className="h-5 w-5 text-accent" />
                  Season ELO
                </h2>
                <EloBadge elo={profile.seasonElo} size="md" />
              </div>
              <p className="text-sm text-text-secondary">
                Your current season rating
              </p>
            </Card>
          </div>

          {/* Match Stats */}
          <Card className="p-6 mb-8">
            <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Match Statistics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="text-center p-4 bg-bg-secondary rounded-xl">
                <div className="text-xl sm:text-3xl font-bold text-text-primary mb-1">
                  {profile.matchesPlayed}
                </div>
                <div className="text-sm text-text-secondary">Matches</div>
              </div>
              <div className="text-center p-4 bg-bg-secondary rounded-xl">
                <div className="text-xl sm:text-3xl font-bold text-green-500 mb-1">
                  {profile.wins}
                </div>
                <div className="text-sm text-text-secondary">Wins</div>
              </div>
              <div className="text-center p-4 bg-bg-secondary rounded-xl">
                <div className="text-xl sm:text-3xl font-bold text-red-500 mb-1">
                  {profile.losses}
                </div>
                <div className="text-sm text-text-secondary">Losses</div>
              </div>
              <div className="text-center p-4 bg-bg-secondary rounded-xl">
                <div className="text-xl sm:text-3xl font-bold text-text-primary mb-1">
                  {profile.winRate}%
                </div>
                <div className="text-sm text-text-secondary">Win Rate</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl border border-orange-500/20 col-span-2 sm:col-span-1">
                <div className="text-xl sm:text-3xl font-bold text-orange-500 mb-1 flex items-center justify-center gap-1">
                  <Flame className="h-4 w-4 sm:h-5 sm:w-5" />
                  {profile.currentStreak}
                </div>
                <div className="text-sm text-text-secondary">Streak</div>
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
            {recentMatches.length > 0 ? (
              <div className="space-y-4">
                {recentMatches.map((match) => (
                  <MatchCardFromMatch key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No matches yet</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
