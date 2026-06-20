'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { TournamentBracket } from '@/components/tournaments/Bracket';
import { 
  Trophy, Users, ArrowLeft, Plus, User, Users as UsersIcon, 
  Braces, Play, Target
} from 'lucide-react';

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
  userId: string;
  user: {
    id: string;
    name: string;
    image: string | null;
    foreverElo: number;
  };
  eloAtEntry: number;
  paidEntry: boolean;
  finalPlacement?: number;
}

interface Bracket {
  id: string;
  round: number;
  position: number;
  matchId?: string;
  player1Id?: string;
  player2Id?: string;
  winnerId?: string;
  bracketType?: string;
  isBye?: boolean;
}

interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  player1?: { name: string; image: string | null };
  player2?: { name: string; image: string | null };
  player1Score: number;
  player2Score: number;
  winnerId?: string;
  createdAt: string;
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
  creator: {
    id: string;
    name: string;
    image: string | null;
  };
  participants: Participant[];
  brackets?: Bracket[];
  matches?: Match[];
}

export default function TournamentDetailPage() {
  const { data: session, status: sessionStatus } = useSession();
  const params = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [loggingMatch, setLoggingMatch] = useState<{ bracket: Bracket; player1: any; player2: any } | null>(null);
  const [scores, setScores] = useState({ player1: '', player2: '' });
  const [winner, setWinner] = useState<'player1' | 'player2' | ''>('');

  const isAdmin = (session?.user as any)?.role === 'ADMIN';

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

  const refreshTournament = async () => {
    const res = await fetch(`/api/tournaments/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setTournament(data.tournament);
    }
  };

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
        await refreshTournament();
      }
    } catch (error) {
      console.error('Failed to join tournament:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleStartTournament = async () => {
    if (!confirm('Start the tournament? This will generate the bracket.')) return;
    
    setIsStarting(true);
    try {
      const res = await fetch(`/api/tournaments/${params.id}/start`, {
        method: 'POST',
      });
      if (res.ok) {
        await refreshTournament();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to start tournament');
      }
    } catch (error) {
      console.error('Failed to start tournament:', error);
      alert('Failed to start tournament');
    } finally {
      setIsStarting(false);
    }
  };

  const handleLogMatch = async () => {
    if (!loggingMatch || !scores.player1 || !scores.player2 || !winner) {
      alert('Please enter both scores and select a winner');
      return;
    }

    const p1Score = parseInt(scores.player1);
    const p2Score = parseInt(scores.player2);
    const winnerId = winner === 'player1' ? loggingMatch.player1.id : loggingMatch.player2.id;

    try {
      const res = await fetch(`/api/tournaments/${params.id}/log-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1Id: loggingMatch.player1.id,
          player2Id: loggingMatch.player2.id,
          player1Score: p1Score,
          player2Score: p2Score,
          winnerId,
          round: loggingMatch.bracket.round,
          position: loggingMatch.bracket.position,
        }),
      });

      if (res.ok) {
        setLoggingMatch(null);
        setScores({ player1: '', player2: '' });
        setWinner('');
        await refreshTournament();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to log match');
      }
    } catch (error) {
      console.error('Failed to log match:', error);
      alert('Failed to log match');
    }
  };

  const isParticipant = session?.user && tournament?.participants.some(
    (p) => p.user.id === session.user?.id
  );

  // Get player name by ID
  const getPlayerName = (playerId?: string) => {
    if (!playerId || !tournament) return null;
    const participant = tournament.participants.find(p => p.userId === playerId);
    return participant?.user;
  };

  // Get match result
  const getMatchResult = (bracket: Bracket) => {
    if (!bracket.matchId || !tournament?.matches) return null;
    return tournament.matches.find(m => m.id === bracket.matchId);
  };

  // Get pending matches for logging
  const getPendingMatches = () => {
    if (!tournament?.brackets || !tournament.participants) return [];
    return tournament.brackets.filter(b => 
      b.player1Id && b.player2Id && !b.matchId
    );
  };

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

  const pendingMatches = getPendingMatches();

  return (
    <>
      {/* Match Logging Modal */}
      {loggingMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-text-primary mb-4">Log Match Result</h3>
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-8">
                  <div>
                    <Avatar 
                      src={loggingMatch.player1.image || undefined}
                      alt={loggingMatch.player1.name}
                      fallback={loggingMatch.player1.name.charAt(0)}
                      size="lg"
                    />
                    <p className="font-medium text-text-primary mt-2">{loggingMatch.player1.name}</p>
                    <p className="text-sm text-text-muted">{getPlayerName(loggingMatch.bracket.player1Id)?.foreverElo} ELO</p>
                  </div>
                  <span className="text-2xl font-bold text-text-muted">vs</span>
                  <div>
                    <Avatar 
                      src={loggingMatch.player2.image || undefined}
                      alt={loggingMatch.player2.name}
                      fallback={loggingMatch.player2.name.charAt(0)}
                      size="lg"
                    />
                    <p className="font-medium text-text-primary mt-2">{loggingMatch.player2.name}</p>
                    <p className="text-sm text-text-muted">{getPlayerName(loggingMatch.bracket.player2Id)?.foreverElo} ELO</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {loggingMatch.player1.name} Score
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="21"
                    value={scores.player1}
                    onChange={(e) => setScores({ ...scores, player1: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {loggingMatch.player2.name} Score
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="21"
                    value={scores.player2}
                    onChange={(e) => setScores({ ...scores, player2: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Winner</label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={winner === 'player1' ? 'primary' : 'outline'}
                    onClick={() => setWinner('player1')}
                  >
                    {loggingMatch.player1.name}
                  </Button>
                  <Button
                    variant={winner === 'player2' ? 'primary' : 'outline'}
                    onClick={() => setWinner('player2')}
                  >
                    {loggingMatch.player2.name}
                  </Button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setLoggingMatch(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleLogMatch} className="flex-1">
                  Save Result
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <Link href="/tournaments" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to Tournaments
            </Link>

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
                  <p className="text-sm text-text-secondary mt-1">Match Type</p>
                </div>
                <div className="p-4 bg-bg-secondary rounded-xl text-center">
                  <div className="text-accent text-lg font-bold">{tournament.format.replace('_', ' ')}</div>
                  <p className="text-sm text-text-secondary mt-1">Format</p>
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
                  <Badge variant="success">Registered</Badge>
                )}

                {isAdmin && tournament.status === 'REGISTRATION_OPEN' && tournament.participants.length >= 2 && (
                  <Button onClick={handleStartTournament} isLoading={isStarting} className="bg-green-600 hover:bg-green-700">
                    <Play className="h-4 w-4 mr-2" />
                    Start Tournament
                  </Button>
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
          {/* Pending Matches for Admin */}
          {isAdmin && pendingMatches.length > 0 && tournament.status === 'IN_PROGRESS' && (
            <Card className="p-6 mb-6 border-2 border-accent">
              <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
                Matches to Log ({pendingMatches.length})
              </h2>
              <div className="space-y-2">
                {pendingMatches.map((bracket) => {
                  const p1 = getPlayerName(bracket.player1Id);
                  const p2 = getPlayerName(bracket.player2Id);
                  return (
                    <div 
                      key={bracket.id}
                      className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg cursor-pointer hover:bg-bg-secondary/80"
                      onClick={() => p1 && p2 && setLoggingMatch({ bracket, player1: p1, player2: p2 })}
                    >
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">R{bracket.round}</Badge>
                        <span className="font-medium">{p1?.name}</span>
                        <span className="text-text-muted">vs</span>
                        <span className="font-medium">{p2?.name}</span>
                      </div>
                      <Button size="sm" variant="outline">Log Result</Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

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
          {tournament.status === 'IN_PROGRESS' && (tournament.brackets?.length ?? 0) > 0 && (
            <Card className="p-6">
              <TournamentBracket
                brackets={tournament.brackets || []}
                format={tournament.format}
                players={tournament.participants}
                onMatchClick={(bracket) => {
                  const p1 = getPlayerName(bracket.player1Id);
                  const p2 = getPlayerName(bracket.player2Id);
                  if (p1 && p2) {
                    setLoggingMatch({ bracket, player1: p1, player2: p2 });
                  }
                }}
                isAdmin={isAdmin}
              />
            </Card>
          )}

          {/* No Bracket Yet */}
          {tournament.status === 'IN_PROGRESS' && (tournament.brackets?.length ?? 0) === 0 && (
            <Card className="p-6 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-text-muted" />
              <h3 className="font-semibold text-text-primary mb-2">Tournament In Progress</h3>
              <p className="text-text-secondary">Bracket is being generated...</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
