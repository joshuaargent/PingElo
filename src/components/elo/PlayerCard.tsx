'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { cn, formatNumber, formatRelativeTime } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EloBadge } from './EloBadge';
import { Badge } from '@/components/ui/Badge';
import { Flame, AlertCircle, TrendingUp, Calendar } from 'lucide-react';

interface PlayerCardProps {
  id: string;
  name: string;
  image?: string | null;
  foreverElo: number;
  seasonElo?: number;
  matchesPlayed: number;
  wins?: number;
  losses?: number;
  winRate?: number;
  lastMatchDate?: Date | string | null;
  isRusty?: boolean;
  isActive?: boolean;
  rank?: number;
  showFullStats?: boolean;
  className?: string;
}

/**
 * Card displaying a player's profile and stats
 */
export const PlayerCard = forwardRef<HTMLDivElement, PlayerCardProps>(
  (
    {
      id,
      name,
      image,
      foreverElo,
      seasonElo,
      matchesPlayed,
      wins,
      losses,
      winRate,
      lastMatchDate,
      isRusty,
      isActive,
      rank,
      showFullStats = false,
      className,
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        className={cn('overflow-hidden transition-shadow hover:shadow-md', className)}
      >
        <Link href={`/players/${id}`} className="block">
          <div className="p-6">
            {/* Header with Avatar and Rank */}
            <div className="mb-4 flex items-center gap-4">
              {rank && (
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full font-bold',
                    rank === 1
                      ? 'bg-yellow-100 text-yellow-700'
                      : rank === 2
                      ? 'bg-gray-100 text-gray-700'
                      : rank === 3
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-bg-secondary text-text-secondary'
                  )}
                >
                  #{rank}
                </div>
              )}
              <Avatar
                src={image}
                alt={name}
                fallback={name.charAt(0).toUpperCase()}
                size="lg"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary hover:text-accent">
                  {name}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <EloBadge elo={foreverElo} showLabel={false} size="sm" />
                  {isActive && (
                    <Badge variant="success" size="sm">
                      <Flame className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  )}
                  {isRusty && (
                    <Badge variant="warning" size="sm">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Rusty
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* ELO Display */}
            <div className="mb-4 rounded-lg bg-bg-secondary p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-text-secondary">Forever ELO</span>
                  <p className="text-2xl font-bold text-text-primary">
                    {formatNumber(foreverElo)}
                  </p>
                </div>
                {seasonElo !== undefined && (
                  <div>
                    <span className="text-xs text-text-secondary">Season ELO</span>
                    <p className="text-2xl font-bold text-text-primary">
                      {formatNumber(seasonElo)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-text-secondary">
                  <TrendingUp className="h-4 w-4" />
                  Matches Played
                </span>
                <span className="font-medium text-text-primary">
                  {matchesPlayed}
                </span>
              </div>

              {showFullStats && wins !== undefined && losses !== undefined && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Wins</span>
                    <span className="font-medium text-green-600">{wins}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Losses</span>
                    <span className="font-medium text-red-500">{losses}</span>
                  </div>
                </>
              )}

              {showFullStats && winRate !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Win Rate</span>
                  <span
                    className={cn(
                      'font-medium',
                      winRate >= 60
                        ? 'text-green-600'
                        : winRate >= 40
                        ? 'text-text-primary'
                        : 'text-red-500'
                    )}
                  >
                    {winRate.toFixed(1)}%
                  </span>
                </div>
              )}

              {lastMatchDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-text-secondary">
                    <Calendar className="h-4 w-4" />
                    Last Match
                  </span>
                  <span className="text-text-secondary">
                    {formatRelativeTime(lastMatchDate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </Card>
    );
  }
);

PlayerCard.displayName = 'PlayerCard';
