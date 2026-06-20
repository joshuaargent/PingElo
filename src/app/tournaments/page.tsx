'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { formatNumber } from '@/lib/utils';
import { calculateEntryFee } from '@/lib/elo';
import { Trophy, Users, Calendar, User, Users as UsersIcon, ArrowRight, Plus, Check } from 'lucide-react';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  REGISTRATION_OPEN: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  REGISTRATION_OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

interface Tournament {
  id: string;
  name: string;
  description?: string | null;
  creator: { id: string; name: string; image?: string | null };
  status: string;
  matchType: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  participantCount: number;
  format: string;
  startsAt: string | Date | null;
  createdAt: string | Date;
  participants?: { userId?: string; teamId?: string }[];
}

interface UserTeams {
  id: string;
  name: string;
  foreverElo: number;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
}

interface ExtendedTournament extends Tournament {
  userEntryFee?: number | null;
  userIsRegistered?: boolean;
  userTeams?: UserTeams[];
}

// ============================================
// Tournament Card Component
// ============================================

function TournamentCard({ tournament }: { tournament: ExtendedTournament }) {
  const statusColor = statusColors[tournament.status] || statusColors.DRAFT;
  const statusLabel = statusLabels[tournament.status] || tournament.status;

  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <Card className="p-6 hover:border-accent transition-colors cursor-pointer h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-1">{tournament.name}</h3>
            <p className="text-sm text-text-secondary line-clamp-2">
              {tournament.description || 'No description provided'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={statusColor}>{statusLabel}</Badge>
            {tournament.userIsRegistered && (
              <Badge variant="success" size="sm">
                <Check className="h-3 w-3 mr-1" />
                Registered
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-text-secondary">
              {tournament.matchType === 'DOUBLES' ? (
                <UsersIcon className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
              {tournament.matchType === 'DOUBLES' ? 'Doubles' : 'Singles'}
            </span>
            <span className="text-text-muted">{tournament.format.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-text-secondary">
              <Users className="h-4 w-4" />
              {tournament.participantCount}/{tournament.maxParticipants}
            </span>
            {tournament.userIsRegistered ? (
              <span className="text-green-600 font-medium">Paid</span>
            ) : typeof tournament.userEntryFee === 'number' ? (
              <span className="text-text-muted">
                Entry: {tournament.userEntryFee} ELO
              </span>
            ) : (
              <span className="text-text-muted">Entry: —</span>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-text-secondary">
              <Trophy className="h-4 w-4 text-accent" />
              Prize: {formatNumber(tournament.prizePool)} ELO
            </span>
          </div>

          {tournament.startsAt && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Calendar className="h-4 w-4" />
              {new Date(tournament.startsAt).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <Avatar
            src={tournament.creator.image}
            alt={tournament.creator.name}
            fallback={tournament.creator.name.charAt(0)}
            size="sm"
          />
          <span className="text-sm text-text-secondary">by {tournament.creator.name}</span>
          <ArrowRight className="h-4 w-4 text-text-muted ml-auto" />
        </div>
      </Card>
    </Link>
  );
}

// ============================================
// Tournaments Page
// ============================================

export default function TournamentsPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress'>('all');
  const [matchTypeFilter, setMatchTypeFilter] = useState<'all' | 'singles' | 'doubles'>('all');
  const [tournaments, setTournaments] = useState<ExtendedTournament[]>([]);
  const [userElo, setUserElo] = useState<number | null>(null);
  const [userTeams, setUserTeams] = useState<UserTeams[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch tournaments
        const res = await fetch('/api/tournaments');
        if (res.ok) {
          const data = await res.json();
          setTournaments(data.tournaments || []);
        }

        // Fetch user data if logged in
        if (session?.user?.id) {
          // Fetch user ELO
          const userRes = await fetch(`/api/users/${session.user.id}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            setUserElo(userData.user?.foreverElo ?? null);
          }

          // Fetch user's teams for doubles tournaments
          const teamsRes = await fetch('/api/teams');
          if (teamsRes.ok) {
            const teamsData = await teamsRes.json();
            const activeTeams = (teamsData.teams || []).filter(
              (team: any) => team.isActive && 
              (team.player1Id === session.user.id || team.player2Id === session.user.id)
            );
            setUserTeams(activeTeams);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [session]);

  // Calculate entry fees for each tournament
  const tournamentsWithFees = tournaments.map((tournament) => {
    const userId = session?.user?.id;
    // Check if user is registered (works for both singles and doubles)
    let isRegistered = false;
    if (userId && tournament.participants) {
      isRegistered = tournament.participants.some((p) => {
        if (p.userId === userId) return true; // Singles
        // For doubles, check if any of user's teams are registered
        return userTeams.some((t) => t.id === p.teamId);
      });
    }

    if (isRegistered) {
      return { ...tournament, userIsRegistered: true, userEntryFee: 0 };
    }

    // Only calculate personalized fee if user is logged in
    if (userId) {
      let entryFee: number | null = null;
      
      if (userElo !== null && tournament.matchType === 'SINGLES') {
        entryFee = calculateEntryFee(userElo);
      } else if (tournament.matchType === 'DOUBLES' && userTeams.length > 0) {
        // Use lowest team fee (best deal for user)
        entryFee = Math.min(...userTeams.map(t => calculateEntryFee(t.foreverElo)));
      }

      return { ...tournament, userIsRegistered: false, userEntryFee: entryFee, userTeams };
    }

    // User not logged in
    return { ...tournament, userIsRegistered: false, userEntryFee: null, userTeams };
  });

  const filteredTournaments = tournamentsWithFees.filter((t) => {
    if (filter === 'open') return t.status === 'REGISTRATION_OPEN';
    if (filter === 'in_progress') return t.status === 'IN_PROGRESS';
    return true;
  }).filter((t) => {
    if (matchTypeFilter === 'singles') return t.matchType === 'SINGLES';
    if (matchTypeFilter === 'doubles') return t.matchType === 'DOUBLES';
    return true;
  });

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-16 lg:py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-light px-4 py-1.5 text-sm font-medium text-accent">
              <Trophy className="h-4 w-4" />
              <span>Competition</span>
            </div>

            {/* Title */}
            <h1 className="text-text-primary text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Tournaments
            </h1>

            {/* Subtitle */}
            <p className="text-text-secondary mx-auto mt-4 max-w-2xl text-lg md:text-xl">
              Compete in paid-entry tournaments with prize pools
            </p>

            {/* CTA */}
            <div className="mt-8">
              <Link href="/tournaments/create">
                <Button leftIcon={<Plus className="h-4 w-4" />} size="lg">
                  Create Tournament
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <div className="container mx-auto px-4 pb-16">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {/* Match Type Filter */}
          <div className="inline-flex h-10 items-center justify-center rounded-lg bg-bg-secondary p-1 text-text-secondary">
            <button
              onClick={() => setMatchTypeFilter('all')}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-bg transition-all ${
                matchTypeFilter === 'all'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'hover:bg-bg-primary/50'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setMatchTypeFilter('singles')}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-bg transition-all ${
                matchTypeFilter === 'singles'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'hover:bg-bg-primary/50'
              }`}
            >
              <User className="h-4 w-4" />
              Singles
            </button>
            <button
              onClick={() => setMatchTypeFilter('doubles')}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-bg transition-all ${
                matchTypeFilter === 'doubles'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'hover:bg-bg-primary/50'
              }`}
            >
              <UsersIcon className="h-4 w-4" />
              Doubles
            </button>
          </div>

          {/* Status Filter */}
          <div className="inline-flex h-10 items-center justify-center rounded-lg bg-bg-secondary p-1 text-text-secondary">
            <button
              onClick={() => setFilter('all')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-bg transition-all ${
                filter === 'all'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'hover:bg-bg-primary/50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-bg transition-all ${
                filter === 'open'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'hover:bg-bg-primary/50'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-bg transition-all ${
                filter === 'in_progress'
                  ? 'bg-bg-primary text-text-primary shadow-sm'
                  : 'hover:bg-bg-primary/50'
              }`}
            >
              In Progress
            </button>
          </div>
        </div>

        {/* Loading or Tournament Grid */}
        {isLoading ? (
          <Card className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading tournaments...</p>
          </Card>
        ) : filteredTournaments.length === 0 ? (
          <Card className="p-12 text-center">
            <Trophy className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Tournaments Yet</h3>
            <p className="text-text-secondary mb-4">Create the first tournament!</p>
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              Create Tournament
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
