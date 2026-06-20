'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { formatNumber } from '@/lib/utils';
import { Trophy, Users, Calendar, User, Users as UsersIcon, ArrowRight, Plus } from 'lucide-react';

// Mock tournament data - in production this would come from API
const mockTournaments = [
  {
    id: '1',
    name: 'Weekly Championship',
    description: 'Our weekly tournament with standard single elimination format.',
    creator: { id: '1', name: 'Alex Chen', image: null },
    status: 'REGISTRATION_OPEN',
    matchType: 'SINGLES',
    entryFee: 10,
    prizePool: 610,
    maxParticipants: 8,
    participantCount: 5,
    format: 'SINGLE_ELIMINATION',
    startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Monthly Masters',
    description: 'Monthly tournament with higher stakes and bigger prizes.',
    creator: { id: '2', name: 'Sarah Miller', image: null },
    status: 'IN_PROGRESS',
    matchType: 'SINGLES',
    entryFee: 20,
    prizePool: 720,
    maxParticipants: 8,
    participantCount: 8,
    format: 'SINGLE_ELIMINATION',
    startsAt: new Date(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    name: 'Doubles Championship',
    description: 'Partner up for our doubles tournament! Teams of two compete.',
    creator: { id: '3', name: 'Mike Johnson', image: null },
    status: 'REGISTRATION_OPEN',
    matchType: 'DOUBLES',
    entryFee: 15,
    prizePool: 650,
    maxParticipants: 4,
    participantCount: 2,
    format: 'SINGLE_ELIMINATION',
    startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    name: 'Beginner Friendly',
    description: 'Free entry for players under 1000 ELO. Great for newcomers!',
    creator: { id: '4', name: 'Emma Wilson', image: null },
    status: 'COMPLETED',
    matchType: 'SINGLES',
    entryFee: 0,
    prizePool: 500,
    maxParticipants: 8,
    participantCount: 6,
    format: 'SINGLE_ELIMINATION',
    startsAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
  },
];

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-700',
  REGISTRATION_OPEN: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const statusLabels = {
  DRAFT: 'Draft',
  REGISTRATION_OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// ============================================
// Tournaments Page
// ============================================

export default function TournamentsPage() {
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress'>('all');
  const [matchTypeFilter, setMatchTypeFilter] = useState<'all' | 'singles' | 'doubles'>('all');

  const filteredTournaments = mockTournaments.filter((t) => {
    if (filter === 'open') return t.status === 'REGISTRATION_OPEN';
    if (filter === 'in_progress') return t.status === 'IN_PROGRESS';
    return true;
  }).filter((t) => {
    if (matchTypeFilter === 'singles') return t.matchType === 'SINGLES';
    if (matchTypeFilter === 'doubles') return t.matchType === 'DOUBLES';
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Tournaments"
        description="Compete in paid-entry tournaments with prize pools"
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Create Tournament
          </Button>
        }
      />

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

      {/* Tournament Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}

        {filteredTournaments.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-text-secondary">
            <Trophy className="mb-3 h-12 w-12 opacity-50" />
            <p>No tournaments found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Tournament Card Component
// ============================================

interface Tournament {
  id: string;
  name: string;
  description?: string;
  creator: { id: string; name: string; image?: string | null };
  status: string;
  matchType: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  participantCount: number;
  format: string;
  startsAt: Date;
  createdAt: Date;
}

function TournamentCard({ tournament }: { tournament: Tournament }) {
  const isOpen = tournament.status === 'REGISTRATION_OPEN';
  const isFull = tournament.participantCount >= tournament.maxParticipants;
  const isDoubles = tournament.matchType === 'DOUBLES';

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-text-primary">
                {tournament.name}
              </h3>
              <Badge variant={isDoubles ? 'default' : 'outline'} size="sm">
                {isDoubles ? (
                  <>
                    <UsersIcon className="mr-1 h-3 w-3" />
                    Doubles
                  </>
                ) : (
                  <>
                    <User className="mr-1 h-3 w-3" />
                    Singles
                  </>
                )}
              </Badge>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                statusColors[tournament.status as keyof typeof statusColors]
              }`}
            >
              {statusLabels[tournament.status as keyof typeof statusLabels]}
            </span>
          </div>
          <Trophy className="h-6 w-6 text-accent" />
        </div>

        {/* Description */}
        {tournament.description && (
          <p className="text-sm text-text-secondary mb-4 line-clamp-2">
            {tournament.description}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-xs text-text-secondary">Prize Pool</span>
            <p className="text-lg font-bold text-accent">
              {formatNumber(tournament.prizePool)} ELO
            </p>
          </div>
          <div>
            <span className="text-xs text-text-secondary">Entry Fee</span>
            <p className="text-lg font-medium">
              {tournament.entryFee === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                `${formatNumber(tournament.entryFee)} ELO`
              )}
            </p>
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-text-secondary" />
          <span className="text-sm text-text-secondary">
            {tournament.participantCount} / {tournament.maxParticipants} {isDoubles ? 'teams' : 'players'}
          </span>
          {isFull && (
            <Badge variant="danger" size="sm">Full</Badge>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 mb-4 text-sm text-text-secondary">
          <Calendar className="h-4 w-4" />
          <span>
            {tournament.status === 'COMPLETED' ? (
              'Ended'
            ) : tournament.status === 'IN_PROGRESS' ? (
              'In progress'
            ) : (
              `Starts ${new Date(tournament.startsAt).toLocaleDateString()}`
            )}
          </span>
        </div>

        {/* Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar
              src={tournament.creator.image}
              alt={tournament.creator.name}
              fallback={tournament.creator.name.charAt(0)}
              size="sm"
            />
            <span className="text-sm text-text-secondary">
              by {tournament.creator.name}
            </span>
          </div>
          {isOpen && !isFull && (
            <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Join
            </Button>
          )}
          {tournament.status === 'IN_PROGRESS' && (
            <Button size="sm" variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
              View
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
