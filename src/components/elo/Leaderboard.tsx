'use client';

import { forwardRef, useState } from 'react';
import Link from 'next/link';
import { cn, formatNumber, formatRelativeTime } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { EloBadge } from './EloBadge';
import { Badge } from '@/components/ui/Badge';
import { Flame, Trophy, AlertCircle } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  image?: string | null;
  foreverElo: number;
  seasonElo: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  lastMatchDate?: Date | null;
  isRusty: boolean;
  isActive: boolean;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  type?: 'forever' | 'season';
  showSeasonElo?: boolean;
  className?: string;
  onEntryClick?: (entry: LeaderboardEntry) => void;
}

/**
 * Leaderboard component displaying ranked players
 */
export const Leaderboard = forwardRef<HTMLDivElement, LeaderboardProps>(
  (
    {
      entries,
      type = 'forever',
      showSeasonElo = false,
      className,
      onEntryClick,
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('w-full', className)}>
        <div className="overflow-hidden rounded-xl border border-border bg-bg-primary">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
                  Player
                </th>
                <th className="hidden px-4 py-3 text-right text-sm font-semibold text-text-secondary sm:table-cell">
                  {type === 'forever' ? 'Forever ELO' : 'Season ELO'}
                </th>
                <th className="hidden px-4 py-3 text-right text-sm font-semibold text-text-secondary md:table-cell">
                  Record
                </th>
                <th className="hidden px-4 py-3 text-right text-sm font-semibold text-text-secondary lg:table-cell">
                  Win Rate
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-text-secondary">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  type={type}
                  showSeasonElo={showSeasonElo}
                  onClick={() => onEntryClick?.(entry)}
                />
              ))}
            </tbody>
          </table>

          {entries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <Trophy className="mb-3 h-12 w-12 opacity-50" />
              <p>No players yet</p>
              <p className="mt-1 text-sm">Be the first to play a match!</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Leaderboard.displayName = 'Leaderboard';

// ============================================
// Leaderboard Row Component
// ============================================

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  type?: 'forever' | 'season';
  showSeasonElo?: boolean;
  onClick?: () => void;
}

function LeaderboardRow({ entry, type, showSeasonElo, onClick }: LeaderboardRowProps) {
  const displayElo = type === 'forever' ? entry.foreverElo : entry.seasonElo;
  const isTopThree = entry.rank <= 3;

  return (
    <tr
      onClick={onClick}
      className={cn(
        'group cursor-pointer transition-colors hover:bg-bg-secondary',
        isTopThree && 'bg-primary/5'
      )}
    >
      {/* Rank */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {isTopThree ? (
            <RankBadge rank={entry.rank} />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-secondary text-sm font-medium text-text-secondary">
              {entry.rank}
            </span>
          )}
        </div>
      </td>

      {/* Player */}
      <td className="px-4 py-4">
        <Link
          href={`/players/${entry.userId}`}
          className="flex items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar
            src={entry.image}
            alt={entry.name}
            fallback={entry.name.charAt(0).toUpperCase()}
            size="sm"
          />
          <div className="flex flex-col">
            <span className="font-medium text-text-primary group-hover:text-accent">
              {entry.name}
            </span>
            <span className="text-sm text-text-secondary sm:hidden">
              <EloBadge elo={displayElo} showLabel={false} size="sm" />
            </span>
          </div>
        </Link>
      </td>

      {/* ELO */}
      <td className="hidden px-4 py-4 text-right sm:table-cell">
        <div className="flex flex-col items-end gap-1">
          <EloBadge elo={displayElo} showLabel={false} />
          {showSeasonElo && type === 'forever' && (
            <span className="text-xs text-text-secondary">
              Season: {formatNumber(entry.seasonElo)}
            </span>
          )}
        </div>
      </td>

      {/* Record */}
      <td className="hidden px-4 py-4 text-right md:table-cell">
        <span className="font-medium text-text-primary">
          {entry.wins}W - {entry.losses}L
        </span>
      </td>

      {/* Win Rate */}
      <td className="hidden px-4 py-4 text-right lg:table-cell">
        <span
          className={cn(
            'font-medium',
            entry.winRate >= 60
              ? 'text-green-600'
              : entry.winRate >= 40
              ? 'text-text-primary'
              : 'text-red-600'
          )}
        >
          {entry.winRate.toFixed(1)}%
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <div className="flex justify-center gap-1">
          {entry.isActive && (
            <Badge variant="success" size="sm">
              <Flame className="mr-1 h-3 w-3" />
              Active
            </Badge>
          )}
          {entry.isRusty && (
            <Badge variant="warning" size="sm">
              <AlertCircle className="mr-1 h-3 w-3" />
              Rusty
            </Badge>
          )}
        </div>
      </td>
    </tr>
  );
}

// ============================================
// Rank Badge Component
// ============================================

interface RankBadgeProps {
  rank: number;
}

function RankBadge({ rank }: RankBadgeProps) {
  const colors = {
    1: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    2: 'bg-gray-100 text-gray-700 border-gray-300',
    3: 'bg-orange-100 text-orange-700 border-orange-300',
  };

  const icons = {
    1: <Trophy className="h-4 w-4" />,
    2: null,
    3: null,
  };

  return (
    <div
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-full border font-bold',
        colors[rank as keyof typeof colors] || 'bg-bg-secondary text-text-secondary'
      )}
    >
      {icons[rank as keyof typeof icons] || rank}
    </div>
  );
}
