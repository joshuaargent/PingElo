'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { PageHero } from '@/components/layout/PageHero';
import { MatchCardFromMatch } from '@/components/elo/MatchCard';
import { Clock, Filter, Trophy } from 'lucide-react';

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
  tournament?: { id: string; name: string };
}

// ============================================
// Match History Page
// ============================================

export default function MatchHistoryPage() {
  const { data: session, status } = useSession();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      redirect('/auth/signin');
    }
  }, [session, status]);

  useEffect(() => {
    async function fetchMatches() {
      if (!session?.user?.id) return;
      
      setIsLoading(true);
      try {
        const res = await fetch(`/api/matches?userId=${session.user.id}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          setMatches(data.matches || []);
        }
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (session?.user?.id) {
      fetchMatches();
    }
  }, [session?.user?.id]);

  const filteredMatches = matches.filter((match) => {
    if (filter === 'all') return true;
    if (filter === 'wins') return match.winnerId === session?.user?.id;
    if (filter === 'losses') return match.winnerId !== session?.user?.id;
    return true;
  });

  const wins = matches.filter(m => m.winnerId === session?.user?.id).length;
  const losses = matches.filter(m => m.winnerId !== session?.user?.id).length;

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading match history...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHero
        title="Match History"
        description="Your recent ping pong matches"
      />

      {/* Content Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-text-primary">{matches.length}</p>
              <p className="text-sm text-text-secondary">Total Matches</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-green-500">{wins}</p>
              <p className="text-sm text-text-secondary">Wins</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-red-500">{losses}</p>
              <p className="text-sm text-text-secondary">Losses</p>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex h-10 items-center justify-center rounded-lg bg-bg-secondary p-1">
              <button
                onClick={() => setFilter('all')}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-bg-primary text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('wins')}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                  filter === 'wins'
                    ? 'bg-bg-primary text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Wins
              </button>
              <button
                onClick={() => setFilter('losses')}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                  filter === 'losses'
                    ? 'bg-bg-primary text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Losses
              </button>
            </div>
          </div>

          {/* Match List */}
          {filteredMatches.length > 0 ? (
            <div className="space-y-4">
              {filteredMatches.map((match) => (
                <MatchCardFromMatch key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Trophy className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">No Matches Yet</h3>
              <p className="text-text-secondary">Start logging your matches!</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
