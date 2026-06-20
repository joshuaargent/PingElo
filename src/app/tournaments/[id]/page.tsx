'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { MatchCardFromMatch } from '@/components/elo/MatchCard';
import { Trophy, Users, Calendar, ArrowLeft, Plus, User, Users as UsersIcon, Crown, Braces } from 'lucide-react';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  REGISTRATION_OPEN: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  REGISTRATION_OPEN: 'Registration Open',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

interface Participant {
  id: string;
  user: {
    id: string;
    name: string;
    image: string | null;
    foreverElo: number;
    doublesForeverElo?: number;
  };
  eloAtEntry: number;
  paidEntry: boolean;
  finalPlacement?: number;
}

interface Tournament {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  matchType: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  format: string;
  startsAt: string | null;
  creator: {
    id: string;
    name: string;
    image: string | null;
  };
  participants: Participant[];
  matches: any[];
}

export default function TournamentDetailPage() {
  const { data: session, status: sessionStatus } = useSession();
  const params = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    async function fetchTournament() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/tournaments/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setTournament(data.tournament);
        }
      } catch (error) {
        console.error('Failed to fetch tournament:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTournament();
  }, [params.id]);

  const handleJoin = async () => {
    if (!session?.user) {
      redirect('/auth/signin');
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch(`/api/tournaments/${params.id}/join`, {
        method: 'POST',
      });
      if (res.ok) {
        // Refresh tournament data
        const refreshRes = await fetch(`/api/tournaments/${params.id}`);
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setTournament(data.tournament);
        }
      }
    } catch (error) {
      console.error('Failed to join tournament:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const isParticipant = session?.user && tournament?.participants.some(
    (p) => p.user.id === session.user?.id
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Tournament Not Found</h1>
        <p className="text-text-secondary mb-8">This tournament doesn't exist or has been deleted.</p>
        <Link href="/tournaments">
          <Button>Back to Tournaments</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="container">
          <div className="mx-auto max-w-4xl">
            {/* Back Button */}
            <Link href="/tournaments" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to Tournaments
            </Link>

            {/* Tournament Header */}
            <Card className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-text-primary">{tournament.name}</h1>
                    <Badge className={statusColors[tournament.status]}>
                      {statusLabels[tournament.status]}
                    </Badge>
                  </div>
                  <p className="text-text-secondary">
                    {tournament.description || 'No description provided'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-bg-secondary rounded-xl text-center">
                  <div className="flex items-center justify-center gap-2 text-accent text-lg font-bold">
                    {tournament.matchType === 'DOUBLES' ? <UsersIcon className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    {tournament.matchType === 'DOUBLES' ? 'Doubles' : 'Singles'}
                  </div>
                  <p className="text-sm text-text-secondary mt-1">Format</p>
                </div>
                <div className="p-4 bg-bg-secondary rounded-xl text-center">
                  <div className="text-accent text-lg font-bold">{tournament.format.replace('_', ' ')}</div>
                  <p className="text-sm text-text-secondary mt-1">Bracket Type</p>
                </div>
                <div className="p-4 bg-bg-secondary rounded-xl text-center">
                  <div className="text-accent text-lg font-bold">{tournament.participants.length}/{tournament.maxParticipants}</div>
                  <p className="text-sm text-text-secondary mt-1">Players</p>
                </div>
                <div className="p-4 bg-bg-secondary rounded-xl text-center">
                  <div className="text-accent text-lg font-bold">{tournament.entryFee > 0 ? `${tournament.entryFee} ELO` : 'Free'}</div>
                  <p className="text-sm text-text-secondary mt-1">Entry Fee</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={tournament.creator.image}
                    alt={tournament.creator.name}
                    fallback={tournament.creator.name.charAt(0)}
                    size="sm"
                  />
                  <span className="text-sm text-text-secondary">
                    Created by {tournament.creator.name}
                  </span>
                </div>

                {tournament.status === 'REGISTRATION_OPEN' && !isParticipant && session?.user && (
                  <Button onClick={handleJoin} isLoading={isJoining}>
                    <Plus className="h-4 w-4 mr-2" />
                    Join Tournament
                  </Button>
                )}

                {tournament.status === 'REGISTRATION_OPEN' && isParticipant && (
                  <Badge variant="success">You're Registered</Badge>
                )}
              </div>
            </Card>

            {/* Prize Pool */}
            <Card className="p-6 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-accent" />
                    Prize Pool
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    1st: 60% | 2nd: 25% | 3rd/4th: 7.5% each
                  </p>
                </div>
                <div className="text-3xl font-bold text-accent">{tournament.prizePool} ELO</div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          {/* Participants */}
          <Card className="p-6 mb-6">
            <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Participants ({tournament.participants.length}/{tournament.maxParticipants})
            </h2>

            {tournament.participants.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tournament.participants.map((participant, index) => (
                  <div key={participant.id} className="p-3 bg-bg-secondary rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-accent font-bold text-sm">
                        {index + 1}
                      </div>
                      <Avatar
                        src={participant.user.image}
                        alt={participant.user.name}
                        fallback={participant.user.name.charAt(0)}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium text-text-primary text-sm">{participant.user.name}</p>
                        <p className="text-xs text-text-muted">
                          {participant.eloAtEntry} ELO
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No participants yet</p>
              </div>
            )}
          </Card>

          {/* Bracket Visualization */}
          {tournament.status === 'IN_PROGRESS' && tournament.matches.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Braces className="h-5 w-5 text-accent" />
                Bracket View
              </h2>
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Simplified bracket display */}
                  <div className="flex items-start gap-8">
                    {/* Quarter Finals / Round 1 */}
                    <div className="flex flex-col gap-4">
                      <h3 className="text-sm font-medium text-text-secondary text-center">Quarter Finals</h3>
                      {tournament.matches.slice(0, 4).map((match, i) => (
                        <div key={match.id} className="w-48 p-3 bg-bg-secondary rounded-lg border border-border">
                          <div className="flex items-center justify-between">
                            <span className={match.winnerId === match.player1?.id ? 'font-bold text-green-600' : 'text-text-muted'}>
                              {match.player1?.name || 'TBD'}
                            </span>
                            <span className="font-bold">{match.player1Score}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className={match.winnerId === match.player2?.id ? 'font-bold text-green-600' : 'text-text-muted'}>
                              {match.player2?.name || 'TBD'}
                            </span>
                            <span className="font-bold">{match.player2Score}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Semi Finals / Round 2 */}
                    <div className="flex flex-col gap-8 justify-center mt-8">
                      <h3 className="text-sm font-medium text-text-secondary text-center">Semi Finals</h3>
                      {tournament.matches.slice(4, 6).length > 0 ? (
                        tournament.matches.slice(4, 6).map((match) => (
                          <div key={match.id} className="w-48 p-3 bg-bg-secondary rounded-lg border border-border">
                            <div className="flex items-center justify-between">
                              <span className={match.winnerId === match.player1?.id ? 'font-bold text-green-600' : 'text-text-muted'}>
                                {match.player1?.name || 'TBD'}
                              </span>
                              <span className="font-bold">{match.player1Score}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className={match.winnerId === match.player2?.id ? 'font-bold text-green-600' : 'text-text-muted'}>
                                {match.player2?.name || 'TBD'}
                              </span>
                              <span className="font-bold">{match.player2Score}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="w-48 p-3 bg-bg-secondary rounded-lg border border-border border-dashed">
                            <div className="flex items-center justify-between">
                              <span className="text-text-muted">TBD</span>
                              <span className="text-text-muted">-</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-text-muted">TBD</span>
                              <span className="text-text-muted">-</span>
                            </div>
                          </div>
                          <div className="w-48 p-3 bg-bg-secondary rounded-lg border border-border border-dashed">
                            <div className="flex items-center justify-between">
                              <span className="text-text-muted">TBD</span>
                              <span className="text-text-muted">-</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-text-muted">TBD</span>
                              <span className="text-text-muted">-</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Finals */}
                    <div className="flex flex-col gap-4 justify-center mt-8">
                      <h3 className="text-sm font-medium text-text-secondary text-center">Finals</h3>
                      {tournament.matches.slice(-1).map((match) => (
                        <div key={match.id} className="w-48 p-3 bg-accent/10 rounded-lg border-2 border-accent">
                          <div className="flex items-center justify-between">
                            <span className={match.winnerId === match.player1?.id ? 'font-bold text-green-600' : 'text-text-muted'}>
                              {match.player1?.name || 'TBD'}
                            </span>
                            <span className="font-bold">{match.player1Score}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className={match.winnerId === match.player2?.id ? 'font-bold text-green-600' : 'text-text-muted'}>
                              {match.player2?.name || 'TBD'}
                            </span>
                            <span className="font-bold">{match.player2Score}</span>
                          </div>
                        </div>
                      ))}
                      {tournament.matches.length < 7 && (
                        <div className="w-48 p-3 bg-bg-secondary rounded-lg border border-border border-dashed">
                          <div className="flex items-center justify-between">
                            <span className="text-text-muted">TBD</span>
                            <span className="text-text-muted">-</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-text-muted">TBD</span>
                            <span className="text-text-muted">-</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Champion */}
                    <div className="flex flex-col justify-center mt-8">
                      <h3 className="text-sm font-medium text-text-secondary text-center mb-2">Champion</h3>
                      <div className="w-48 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border-2 border-yellow-500 text-center">
                        <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                        {tournament.matches.length > 0 ? (
                          <p className="font-bold text-yellow-700 dark:text-yellow-400">
                            {(() => {
                              const finalMatch = tournament.matches[tournament.matches.length - 1];
                              return finalMatch?.winnerId === finalMatch?.player1?.id 
                                ? finalMatch?.player1?.name 
                                : finalMatch?.player2?.name || 'TBD';
                            })()}
                          </p>
                        ) : (
                          <p className="text-text-muted">TBD</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Matches */}
          <Card className="p-6">
            <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Tournament Matches
            </h2>

            {tournament.matches.length > 0 ? (
              <div className="space-y-4">
                {tournament.matches.map((match) => (
                  <MatchCardFromMatch key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No matches played yet</p>
                <p className="text-sm mt-1">Matches will appear here once the tournament begins</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
