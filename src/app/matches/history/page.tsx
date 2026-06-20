'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MatchCardFromMatch } from '@/components/elo/MatchCard';
import { Filter, Calendar, Trophy, TrendingUp, Clock } from 'lucide-react';

// ============================================
// Match History Page
// ============================================

const mockMatches = [
  {
    id: '1',
    player1: { id: '1', name: 'You', image: null },
    player2: { id: '2', name: 'Alex Chen', image: null },
    player1Score: 21,
    player2Score: 18,
    winnerId: '1',
    isTournament: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
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
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
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
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    eloChange: { player1Change: 24, player2Change: -24 },
  },
  {
    id: '4',
    player1: { id: '1', name: 'You', image: null },
    player2: { id: '5', name: 'Emma Wilson', image: null },
    player1Score: 19,
    player2Score: 21,
    winnerId: '5',
    isTournament: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    eloChange: { player1Change: -8, player2Change: 8 },
  },
  {
    id: '5',
    player1: { id: '1', name: 'You', image: null },
    player2: { id: '6', name: 'James Brown', image: null },
    player1Score: 21,
    player2Score: 15,
    winnerId: '1',
    isTournament: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    eloChange: { player1Change: 16, player2Change: -16 },
  },
  {
    id: '6',
    player1: { id: '1', name: 'You', image: null },
    player2: { id: '7', name: 'Lisa Davis', image: null },
    player1Score: 21,
    player2Score: 8,
    winnerId: '1',
    isTournament: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    eloChange: { player1Change: 32, player2Change: -32 },
  },
];

type FilterType = 'all' | 'wins' | 'losses' | 'tournament';
type TimeFilter = 'all' | 'week' | 'month';

export default function MatchHistoryPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const filteredMatches = mockMatches.filter((match) => {
    if (filter === 'wins') return match.winnerId === '1';
    if (filter === 'losses') return match.winnerId !== '1';
    if (filter === 'tournament') return match.isTournament;
    return true;
  });

  const wins = mockMatches.filter((m) => m.winnerId === '1').length;
  const losses = mockMatches.filter((m) => m.winnerId !== '1').length;
  const totalEloChange = mockMatches.reduce((sum, m) => 
    m.winnerId === '1' ? sum + m.eloChange.player1Change : sum + m.eloChange.player1Change, 0
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Match History"
        description="View all your matches and track your progress"
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 text-center">
          <p className="text-sm text-text-secondary mb-1">Total Matches</p>
          <p className="text-3xl font-bold text-text-primary">{mockMatches.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-text-secondary mb-1">Wins</p>
          <p className="text-3xl font-bold text-green-600">{wins}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-text-secondary mb-1">Losses</p>
          <p className="text-3xl font-bold text-red-600">{losses}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-text-secondary mb-1">ELO Change</p>
          <p className={`text-3xl font-bold ${totalEloChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalEloChange >= 0 ? '+' : ''}{totalEloChange}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-secondary" />
          <span className="text-sm text-text-secondary">Filter:</span>
        </div>
        <div className="inline-flex rounded-lg bg-bg-secondary p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-bg-primary text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('wins')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'wins'
                ? 'bg-bg-primary text-green-600 shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Wins
          </button>
          <button
            onClick={() => setFilter('losses')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'losses'
                ? 'bg-bg-primary text-red-600 shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Losses
          </button>
          <button
            onClick={() => setFilter('tournament')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'tournament'
                ? 'bg-bg-primary text-accent shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Tournaments
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Calendar className="h-4 w-4 text-text-secondary" />
          <span className="text-sm text-text-secondary">Time:</span>
          <div className="inline-flex rounded-lg bg-bg-secondary p-1">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeFilter === 'all'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeFilter === 'month'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeFilter === 'week'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              This Week
            </button>
          </div>
        </div>
      </div>

      {/* Match List */}
      <div className="space-y-4">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <MatchCardFromMatch key={match.id} match={match} />
          ))
        ) : (
          <Card className="p-12 text-center">
            <Clock className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No matches found
            </h3>
            <p className="text-text-secondary">
              {filter !== 'all' 
                ? `You don't have any ${filter} yet.`
                : "You haven't logged any matches yet."}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
