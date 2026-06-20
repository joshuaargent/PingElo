'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { cn, formatRelativeTime, formatNumber } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatEloChange, getEloTierColor } from '@/lib/elo';
import { Trophy, Users, Calendar } from 'lucide-react';

interface MatchPlayer {
  id: string;
  name: string;
  image?: string | null;
  foreverElo?: number;
}

interface MatchCardProps {
  id: string;
  player1: MatchPlayer;
  player2: MatchPlayer;
  player1Score: number;
  player2Score: number;
  player1EloChange: number;
  player2EloChange: number;
  winnerId: string;
  isTournamentMatch?: boolean;
  tournamentName?: string;
  tournamentId?: string;
  createdAt: Date | string;
  className?: string;
}

interface MatchCardFromMatchProps {
  match: {
    id: string;
    player1: MatchPlayer;
    player2: MatchPlayer;
    player1Score: number;
    player2Score: number;
    winnerId: string;
    isTournament?: boolean;
    tournamentName?: string;
    tournamentId?: string;
    createdAt: Date | string;
    eloChange?: { player1Change: number; player2Change: number };
  };
  className?: string;
}

/**
 * Card displaying a match result with ELO changes
 */
export const MatchCard = forwardRef<HTMLDivElement, MatchCardProps>(
  (
    {
      id,
      player1,
      player2,
      player1Score,
      player2Score,
      player1EloChange,
      player2EloChange,
      winnerId,
      isTournamentMatch,
      tournamentName,
      tournamentId,
      createdAt,
      className,
    },
    ref
  ) => {
    const isPlayer1Winner = winnerId === player1.id;
    const player1Won = isPlayer1Winner;
    const player2Won = !isPlayer1Winner;

    return (
      <Card
        ref={ref}
        className={cn('overflow-hidden transition-shadow hover:shadow-md', className)}
      >
        <div className="p-4">
          {/* Match Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Calendar className="h-4 w-4" />
              <span>{formatRelativeTime(createdAt)}</span>
            </div>
            {isTournamentMatch && tournamentName && (
              <Link
                href={`/tournaments/${tournamentId}`}
                className="flex items-center gap-1 text-sm text-accent hover:underline"
              >
                <Trophy className="h-4 w-4" />
                {tournamentName}
              </Link>
            )}
          </div>

          {/* Players and Score */}
          <div className="flex items-center justify-between">
            {/* Player 1 */}
            <div
              className={cn(
                'flex flex-1 flex-col items-center gap-2 rounded-lg p-3',
                player1Won ? 'bg-green-50' : 'bg-gray-50 dark:bg-gray-800/50'
              )}
            >
              <Link
                href={`/players/${player1.id}`}
                className="flex flex-col items-center gap-2"
              >
                <Avatar
                  src={player1.image}
                  alt={player1.name}
                  fallback={player1.name.charAt(0).toUpperCase()}
                  size="md"
                />
                <span className="text-sm font-medium text-text-primary">
                  {player1.name}
                </span>
              </Link>
              <div className="text-center">
                <span
                  className={cn(
                    'text-3xl font-bold',
                    player1Won ? 'text-green-600' : 'text-text-secondary'
                  )}
                >
                  {player1Score}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    'font-bold',
                    player1Won ? 'text-green-600' : 'text-red-500'
                  )}
                >
                  {formatEloChange(player1EloChange)}
                </span>
                {player1.foreverElo && (
                  <span
                    className={cn(
                      'text-xs',
                      getEloTierColor(player1.foreverElo)
                    )}
                  >
                    {formatNumber(player1.foreverElo)} ELO
                  </span>
                )}
              </div>
            </div>

            {/* VS Divider */}
            <div className="flex flex-col items-center px-4">
              <span className="mb-2 text-sm font-medium text-text-secondary">
                vs
              </span>
              <div className="flex h-px w-8 bg-border" />
              <span className="mt-2 text-xs text-text-secondary">
                {player1Won ? 'W' : 'L'}
              </span>
            </div>

            {/* Player 2 */}
            <div
              className={cn(
                'flex flex-1 flex-col items-center gap-2 rounded-lg p-3',
                player2Won ? 'bg-green-50' : 'bg-gray-50 dark:bg-gray-800/50'
              )}
            >
              <Link
                href={`/players/${player2.id}`}
                className="flex flex-col items-center gap-2"
              >
                <Avatar
                  src={player2.image}
                  alt={player2.name}
                  fallback={player2.name.charAt(0).toUpperCase()}
                  size="md"
                />
                <span className="text-sm font-medium text-text-primary">
                  {player2.name}
                </span>
              </Link>
              <div className="text-center">
                <span
                  className={cn(
                    'text-3xl font-bold',
                    player2Won ? 'text-green-600' : 'text-text-secondary'
                  )}
                >
                  {player2Score}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    'font-bold',
                    player2Won ? 'text-green-600' : 'text-red-500'
                  )}
                >
                  {formatEloChange(player2EloChange)}
                </span>
                {player2.foreverElo && (
                  <span
                    className={cn(
                      'text-xs',
                      getEloTierColor(player2.foreverElo)
                    )}
                  >
                    {formatNumber(player2.foreverElo)} ELO
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }
);

MatchCard.displayName = 'MatchCard';

/**
 * MatchCard variant that accepts a single `match` object
 */
export function MatchCardFromMatch({ match, className }: MatchCardFromMatchProps) {
  return (
    <MatchCard
      id={match.id}
      player1={match.player1}
      player2={match.player2}
      player1Score={match.player1Score}
      player2Score={match.player2Score}
      player1EloChange={match.eloChange?.player1Change ?? 0}
      player2EloChange={match.eloChange?.player2Change ?? 0}
      winnerId={match.winnerId}
      isTournamentMatch={match.isTournament}
      tournamentName={match.tournamentName}
      tournamentId={match.tournamentId}
      createdAt={match.createdAt}
      className={className}
    />
  );
}
