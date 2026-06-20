'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Leaderboard } from '@/components/elo/Leaderboard';
import { Button } from '@/components/ui/Button';
import { User, Users } from 'lucide-react';

// Mock data for preview - in production this would come from API
const mockLeaderboardData = [
  { rank: 1, userId: '1', name: 'Alex Chen', image: null, foreverElo: 1285, seasonElo: 1250, doublesForeverElo: 1190, doublesSeasonElo: 1150, matchesPlayed: 45, wins: 32, losses: 13, winRate: 71.1, lastMatchDate: new Date(), isRusty: false, isActive: true },
  { rank: 2, userId: '2', name: 'Sarah Miller', image: null, foreverElo: 1240, seasonElo: 1220, doublesForeverElo: 1210, doublesSeasonElo: 1180, matchesPlayed: 38, wins: 26, losses: 12, winRate: 68.4, lastMatchDate: new Date(), isRusty: false, isActive: true },
  { rank: 3, userId: '3', name: 'Mike Johnson', image: null, foreverElo: 1198, seasonElo: 1180, doublesForeverElo: 1150, doublesSeasonElo: 1120, matchesPlayed: 52, wins: 34, losses: 18, winRate: 65.4, lastMatchDate: new Date(), isRusty: false, isActive: true },
  { rank: 4, userId: '4', name: 'Emma Wilson', image: null, foreverElo: 1156, seasonElo: 1140, doublesForeverElo: 1180, doublesSeasonElo: 1160, matchesPlayed: 29, wins: 18, losses: 11, winRate: 62.1, lastMatchDate: new Date(), isRusty: false, isActive: true },
  { rank: 5, userId: '5', name: 'James Brown', image: null, foreverElo: 1105, seasonElo: 1090, doublesForeverElo: 1050, doublesSeasonElo: 1020, matchesPlayed: 22, wins: 12, losses: 10, winRate: 54.5, lastMatchDate: new Date(), isRusty: false, isActive: true },
  { rank: 6, userId: '6', name: 'Lisa Garcia', image: null, foreverElo: 1089, seasonElo: 1080, doublesForeverElo: 1120, doublesSeasonElo: 1100, matchesPlayed: 18, wins: 10, losses: 8, winRate: 55.6, lastMatchDate: new Date(), isRusty: false, isActive: true },
  { rank: 7, userId: '7', name: 'David Kim', image: null, foreverElo: 1050, seasonElo: 1040, doublesForeverElo: 980, doublesSeasonElo: 960, matchesPlayed: 15, wins: 7, losses: 8, winRate: 46.7, lastMatchDate: new Date(), isRusty: false, isActive: true },
  { rank: 8, userId: '8', name: 'Anna Lee', image: null, foreverElo: 1020, seasonElo: 1015, doublesForeverElo: 1080, doublesSeasonElo: 1050, matchesPlayed: 12, wins: 5, losses: 7, winRate: 41.7, lastMatchDate: new Date(), isRusty: false, isActive: true },
  { rank: 9, userId: '9', name: 'Tom Davis', image: null, foreverElo: 985, seasonElo: 980, doublesForeverElo: 950, doublesSeasonElo: 940, matchesPlayed: 8, wins: 3, losses: 5, winRate: 37.5, lastMatchDate: new Date(), isRusty: false, isActive: true },
  { rank: 10, userId: '10', name: 'Rachel White', image: null, foreverElo: 960, seasonElo: 950, doublesForeverElo: 1000, doublesSeasonElo: 980, matchesPlayed: 6, wins: 2, losses: 4, winRate: 33.3, lastMatchDate: new Date(), isRusty: false, isActive: false },
];

type LeaderboardType = 'forever' | 'season';
type MatchType = 'singles' | 'doubles';

// ============================================
// Leaderboard Page
// ============================================

export default function LeaderboardPage() {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('forever');
  const [matchType, setMatchType] = useState<MatchType>('singles');

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Leaderboard"
        description="See how you rank against other players"
      />

      {/* Match Type Selector */}
      <div className="mb-6 flex items-center justify-between">
        <div className="inline-flex h-10 items-center justify-center rounded-lg bg-bg-secondary p-1 text-text-secondary">
          <button
            onClick={() => setMatchType('singles')}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-bg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
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
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-bg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
              matchType === 'doubles'
                ? 'bg-bg-primary text-text-primary shadow-sm'
                : 'hover:bg-bg-primary/50'
            }`}
          >
            <Users className="h-4 w-4" />
            Doubles
          </button>
        </div>
      </div>

      {/* ELO Type Selector */}
      <div className="mb-8 flex items-center justify-between">
        <div className="inline-flex h-10 items-center justify-center rounded-lg bg-bg-secondary p-1 text-text-secondary">
          <button
            onClick={() => setLeaderboardType('forever')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-bg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
              leaderboardType === 'forever'
                ? 'bg-bg-primary text-text-primary shadow-sm'
                : 'hover:bg-bg-primary/50'
            }`}
          >
            Forever ELO
          </button>
          <button
            onClick={() => setLeaderboardType('season')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-bg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
              leaderboardType === 'season'
                ? 'bg-bg-primary text-text-primary shadow-sm'
                : 'hover:bg-bg-primary/50'
            }`}
          >
            Season ELO
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      <Leaderboard
        entries={mockLeaderboardData}
        type={leaderboardType}
        matchType={matchType}
        showSeasonElo={leaderboardType === 'forever'}
      />
    </div>
  );
}
