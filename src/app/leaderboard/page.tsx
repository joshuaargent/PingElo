'use client';

import { useState, useEffect } from 'react';
import { Leaderboard } from '@/components/elo/Leaderboard';
import { Card } from '@/components/ui/Card';
import { User, Users, Trophy, TrendingUp, Crown } from 'lucide-react';

type LeaderboardType = 'forever' | 'season';
type MatchType = 'singles' | 'doubles';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  foreverElo: number;
  seasonElo: number;
  doublesForeverElo: number;
  doublesSeasonElo: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  lastMatchDate: Date | null;
  isRusty: boolean;
  isActive: boolean;
}

// ============================================
// Leaderboard Page
// ============================================

export default function LeaderboardPage() {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('forever');
  const [matchType, setMatchType] = useState<MatchType>('singles');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/users?includeStats=true&sortBy=foreverElo&order=desc');
        if (res.ok) {
          const data = await res.json();
          const usersWithRanks = data.users.map((user: any, index: number) => ({
            rank: index + 1,
            userId: user.id,
            name: user.name,
            image: user.image,
            foreverElo: user.foreverElo,
            seasonElo: user.seasonElo,
            doublesForeverElo: user.doublesForeverElo || 1000,
            doublesSeasonElo: user.doublesSeasonElo || 1000,
            matchesPlayed: user.matchesPlayed,
            wins: user.wins || 0,
            losses: user.losses || 0,
            winRate: user.winRate || 0,
            lastMatchDate: user.lastMatchDate,
            isRusty: user.isRusty || false,
            isActive: user.isActive || false,
          }));
          setEntries(usersWithRanks);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <>
      {/* Hero Section - Consistent with homepage styling, no stats */}
      <section className="relative overflow-hidden py-12 md:py-16 lg:py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-light px-4 py-1.5 text-sm font-medium text-accent">
              <Trophy className="h-4 w-4" />
              <span>ELO Rankings</span>
            </div>

            {/* Title */}
            <h1 className="text-text-primary text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Leaderboard
            </h1>

            {/* Subtitle */}
            <p className="text-text-secondary mx-auto mt-4 max-w-2xl text-lg md:text-xl">
              See how you rank against other players
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <div className="container mx-auto px-4 pb-16">
        {/* Filters on One Line */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {/* Match Type Filter */}
          <div className="inline-flex h-10 items-center justify-center rounded-lg bg-bg-secondary p-1 text-text-secondary">
            <button
              onClick={() => setMatchType('singles')}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ring-offset-bg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                matchType === 'singles'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'hover:bg-bg-primary/50'
              }`}
            >
              <User className="h-4 w-4" />
              Singles
            </button>
            <button
              onClick={() => setMatchType('doubles')}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ring-offset-bg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                matchType === 'doubles'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'hover:bg-bg-primary/50'
              }`}
            >
              <Users className="h-4 w-4" />
              Doubles
            </button>
          </div>

          {/* ELO Type Filter */}
          <div className="inline-flex h-10 items-center justify-center rounded-lg bg-bg-secondary p-1 text-text-secondary">
            <button
              onClick={() => setLeaderboardType('forever')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ring-offset-bg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                leaderboardType === 'forever'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'hover:bg-bg-primary/50'
              }`}
            >
              Forever ELO
            </button>
            <button
              onClick={() => setLeaderboardType('season')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ring-offset-bg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                leaderboardType === 'season'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'hover:bg-bg-primary/50'
              }`}
            >
              Season ELO
            </button>
          </div>
        </div>

        {/* Loading or Leaderboard */}
        {isLoading ? (
          <Card className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading leaderboard...</p>
          </Card>
        ) : entries.length === 0 ? (
          <Card className="p-12 text-center">
            <Trophy className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Players Yet</h3>
            <p className="text-text-secondary">Be the first to log a match!</p>
          </Card>
        ) : (
          <Leaderboard
            entries={entries}
            type={leaderboardType}
            matchType={matchType}
            showSeasonElo={leaderboardType === 'forever'}
          />
        )}
      </div>
    </>
  );
}
