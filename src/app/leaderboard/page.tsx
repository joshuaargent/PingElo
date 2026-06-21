'use client';

import { useState, useEffect } from 'react';
import { Leaderboard } from '@/components/elo/Leaderboard';
import { Card } from '@/components/ui/Card';
import { User, Users, Trophy, TrendingUp, Crown, Shield } from 'lucide-react';

type LeaderboardType = 'forever' | 'season' | 'teams';
type MatchType = 'singles' | 'doubles';

interface Season {
  id: string;
  name: string;
  year: number;
  month: number;
  isActive: boolean;
}

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
  const [activeTeamsOnly, setActiveTeamsOnly] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSeasons() {
      try {
        const res = await fetch('/api/seasons');
        if (res.ok) {
          const data = await res.json();
          setSeasons(data.seasons || []);
        }
      } catch (error) {
        console.error('Failed to fetch seasons:', error);
      }
    }
    fetchSeasons();
  }, []);

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);
      try {
        // If teams mode, fetch teams leaderboard
        if (leaderboardType === 'teams') {
          const params = new URLSearchParams({
            activeOnly: activeTeamsOnly.toString(),
          });
          const res = await fetch(`/api/leaderboard/teams?${params.toString()}`);
          if (res.ok) {
            const data = await res.json();
            // Transform teams to match the LeaderboardEntry interface
            const teamsAsEntries = data.teams.map((team: any) => ({
              rank: team.rank,
              userId: team.teamId,
              name: team.name,
              image: null,
              foreverElo: team.elo,
              seasonElo: team.elo,
              doublesForeverElo: team.elo,
              doublesSeasonElo: team.elo,
              matchesPlayed: team.matchesPlayed,
              wins: team.wins,
              losses: team.losses,
              winRate: team.winRate,
              lastMatchDate: null,
              isRusty: false,
              isActive: team.isActive,
            }));
            setEntries(teamsAsEntries);
          }
          setIsLoading(false);
          return;
        }

        // Build the URL with query params
        const params = new URLSearchParams({
          includeStats: 'true',
          sortBy: matchType === 'singles' ? 'foreverElo' : 'doublesForeverElo',
          order: 'desc',
        });

        // Add season filter for season-based queries
        if (leaderboardType === 'season' && selectedSeasonId !== 'all') {
          params.set('seasonId', selectedSeasonId);
        }

        const res = await fetch(`/api/users?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const usersWithRanks = data.users.map((user: any, index: number) => ({
            rank: index + 1,
            userId: user.id,
            name: user.name,
            image: user.image,
            foreverElo: user.foreverElo,
            seasonElo: user.seasonElo || 1000,
            doublesForeverElo: user.doublesForeverElo || 1000,
            doublesSeasonElo: user.doublesSeasonElo || 1000,
            matchesPlayed: matchType === 'singles' 
              ? user.matchesPlayed 
              : (user.doublesMatchesPlayed || 0),
            wins: matchType === 'singles' 
              ? (user.wins || 0) 
              : (user.doublesWins || 0),
            losses: matchType === 'singles' 
              ? (user.losses || 0) 
              : (user.doublesLosses || 0),
            winRate: matchType === 'singles' 
              ? user.winRate || 0 
              : (user.doublesWinRate || 0),
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
  }, [leaderboardType, matchType, selectedSeasonId, activeTeamsOnly]);

  return (
    <>
      {/* Hero Section - Consistent with homepage styling, no stats */}
      <section className="relative overflow-hidden py-8 md:py-12 lg:py-16">
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
              onClick={() => { setLeaderboardType('forever'); setSelectedSeasonId('all'); }}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ring-offset-bg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                leaderboardType === 'forever'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'hover:bg-bg-primary/50'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setLeaderboardType('season')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ring-offset-bg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                leaderboardType === 'season'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'hover:bg-bg-primary/50'
              }`}
            >
              Season
            </button>
            <button
              onClick={() => setLeaderboardType('teams')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium ring-offset-bg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                leaderboardType === 'teams'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'hover:bg-bg-primary/50'
              }`}
            >
              <Shield className="h-4 w-4 mr-1" />
              Teams
            </button>
          </div>

          {/* Season Filter (only shown when season ELO is selected) */}
          {leaderboardType === 'season' && seasons.length > 0 && (
            <select
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
              className="h-10 px-4 rounded-lg border border-border bg-bg-secondary text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="all">All Seasons</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
          )}

          {/* Teams Active Filter (only shown when teams is selected) */}
          {leaderboardType === 'teams' && (
            <label className="inline-flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={activeTeamsOnly}
                onChange={(e) => setActiveTeamsOnly(e.target.checked)}
                className="w-4 h-4 rounded border-border bg-bg-secondary text-accent focus:ring-accent"
              />
              Active teams only
            </label>
          )}
        </div>

        {/* Loading or Leaderboard */}
        {isLoading ? (
          <Card className="p-6 sm:p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading leaderboard...</p>
          </Card>
        ) : entries.length === 0 ? (
          <Card className="p-6 sm:p-12 text-center">
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
