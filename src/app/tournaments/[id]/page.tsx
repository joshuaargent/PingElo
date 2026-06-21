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
import { calculateEntryFee } from '@/lib/elo';
import { 
  Trophy, Users, ArrowLeft, Plus, User, Users as UsersIcon, 
  Braces, Play, Target, X
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

// User participant for singles tournaments
interface UserParticipant {
  id: string;
  userId: string;
  teamId?: null;
  eloAtEntry: number;
  paidEntry: boolean;
  finalPlacement?: number;
  user: {
    id: string;
    name: string;
    image: string | null;
    foreverElo: number;
  };
}

// Team participant for doubles tournaments
interface TeamParticipant {
  id: string;
  userId?: null;
  teamId: string;
  eloAtEntry: number;
  paidEntry: boolean;
  finalPlacement?: number;
  team: {
    id: string;
    name: string | null;
    foreverElo: number;
    player1: { id: string; name: string; image: string | null };
    player2: { id: string; name: string; image: string | null };
  };
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
  maxScore: number;
  format: string;
  creatorId: string;
  startsAt: string | null;
  creator: {
    id: string;
    name: string;
    image: string | null;
  };
  participants: (UserParticipant | TeamParticipant)[];
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
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [userElo, setUserElo] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    entryFee: 0,
    maxParticipants: 0,
    maxScore: 21,
    startsAt: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showTeamSelect, setShowTeamSelect] = useState(false);
  const [loggingMatch, setLoggingMatch] = useState<{ bracket: Bracket; player1: any; player2: any } | null>(null);
  const [scores, setScores] = useState({ player1: '', player2: '' });


  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const isCreator = tournament?.creatorId === session?.user?.id;
  const canEdit = isAdmin || isCreator;

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
    
    // Fetch user's teams if tournament is doubles
    if (session?.user) {
      fetch('/api/teams')
        .then(res => res.ok ? res.json() : { teams: [] })
        .then(data => setUserTeams(data.teams || []))
        .catch(() => setUserTeams([]));
      fetch(`/api/users/${session.user.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.user) setUserElo(data.user.foreverElo);
        })
        .catch(() => setUserElo(null));
    }
  }, [params.id, session]);

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

    // For doubles tournaments, show team selection
    if (tournament?.matchType === 'DOUBLES') {
      if (userTeams.length === 0) {
        alert('You need to create a team first to join doubles tournaments. Go to /teams to create one.');
        return;
      }
      setShowTeamSelect(true);
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch(`/api/tournaments/${params.id}/join`, {
        method: 'POST',
      });
      if (res.ok) {
        await refreshTournament();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to join');
      }
    } catch (error) {
      console.error('Failed to join tournament:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinWithTeam = async () => {
    if (!selectedTeamId) {
      alert('Please select a team');
      return;
    }

    setIsJoining(true);
    setShowTeamSelect(false);
    try {
      const res = await fetch(`/api/tournaments/${params.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: selectedTeamId }),
      });
      if (res.ok) {
        await refreshTournament();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to join');
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

  const handleLeave = async () => {
    if (!confirm('Leave this tournament? Your entry fee will be refunded.')) return;
    setIsJoining(true);
    try {
      const res = await fetch(`/api/tournaments/${params.id}/leave`, { method: 'POST' });
      if (res.ok) {
        await refreshTournament();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to leave tournament');
      }
    } catch (error) {
      console.error('Failed to leave tournament:', error);
      alert('Failed to leave tournament');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCancelTournament = async () => {
    if (!confirm('Cancel this tournament? All participants will be refunded.')) return;
    setIsStarting(true);
    try {
      const res = await fetch(`/api/tournaments/${params.id}/cancel`, { method: 'POST' });
      if (res.ok) {
        window.location.href = '/tournaments';
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel tournament');
      }
    } catch (error) {
      console.error('Failed to cancel tournament:', error);
      alert('Failed to cancel tournament');
    } finally {
      setIsStarting(false);
    }
  };

  const openEditModal = () => {
    if (tournament) {
      setEditForm({
        name: tournament.name,
        description: tournament.description || '',
        entryFee: tournament.entryFee || 0,
        maxParticipants: tournament.maxParticipants,
        maxScore: tournament.maxScore || 21,
        startsAt: tournament.startsAt ? new Date(tournament.startsAt).toISOString().slice(0, 16) : '',
      });
      setShowEditModal(true);
    }
  };

  const handleEditTournament = async () => {
    // Validate
    if (!editForm.name.trim()) {
      alert('Please enter a tournament name');
      setIsEditing(false);
      return;
    }
    if (![7, 11, 15, 21].includes(editForm.maxScore)) {
      alert('Max Score must be 7, 11, 15, or 21');
      setIsEditing(false);
      return;
    }

    setIsEditing(true);
    try {
      const res = await fetch(`/api/tournaments/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description || null,
          entryFee: editForm.entryFee || 0,
          maxParticipants: editForm.maxParticipants,
          maxScore: editForm.maxScore,
          startsAt: editForm.startsAt || null
        }),
      });
      if (res.ok) {
        await refreshTournament();
        setShowEditModal(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update tournament');
      }
    } catch (error) {
      console.error('Failed to update tournament:', error);
      alert('Failed to update tournament');
    } finally {
      setIsEditing(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm('Remove this participant? Their entry fee will be refunded.')) return;
    try {
      const res = await fetch(`/api/tournaments/${params.id}/remove-participant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId }),
      });
      if (res.ok) {
        await refreshTournament();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove participant');
      }
    } catch (error) {
      console.error('Failed to remove participant:', error);
      alert('Failed to remove participant');
    }
  };

  const handleLogMatch = async () => {
    if (!loggingMatch || !scores.player2 || !tournament) {
      alert('Please enter Player 2\'s score');
      return;
    }

    const p2Score = parseInt(scores.player2);
    const p1Score = tournament.maxScore || 21;

    // Player 1 always wins
    const winnerId = loggingMatch.player1.id;

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

  // Check if current user is a participant (works for both singles and doubles)
  const isParticipant = session?.user && tournament?.participants.some(
    (p) => {
      if (tournament.matchType === 'DOUBLES') {
        const teamP = p as TeamParticipant;
        return teamP.team?.player1?.id === session.user?.id || teamP.team?.player2?.id === session.user?.id;
      }
      const userP = p as UserParticipant;
      return userP.user?.id === session.user?.id;
    }
  );

  // Get participant name by ID (handles both singles and doubles)
  const getParticipantName = (participantId?: string) => {
    if (!participantId || !tournament) return null;
    const participant = tournament.participants.find(p => p.id === participantId);
    if (!participant) return null;
    
    if (tournament.matchType === 'DOUBLES') {
      const teamP = participant as TeamParticipant;
      const name = teamP.team?.name || `${teamP.team?.player1?.name} & ${teamP.team?.player2?.name}`;
      return { name, foreverElo: teamP.team?.foreverElo || 0 };
    }
    const userP = participant as UserParticipant;
    return { name: userP.user?.name || 'Unknown', foreverElo: userP.user?.foreverElo || 0 };
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

  // Check if current user has a pending match
  const getUserPendingMatch = () => {
    if (!session?.user || !tournament) return null;
    const pending = getPendingMatches();
    for (const bracket of pending) {
      // Check if user is participant 1 or 2
      if (bracket.player1Id === session.user.id || bracket.player2Id === session.user.id) {
        return bracket;
      }
      // For doubles, check team members
      if (tournament.matchType === 'DOUBLES') {
        const p1 = tournament.participants.find(p => p.id === bracket.player1Id) as TeamParticipant | undefined;
        const p2 = tournament.participants.find(p => p.id === bracket.player2Id) as TeamParticipant | undefined;
        const userTeam1 = p1?.team;
        const userTeam2 = p2?.team;
        if ((userTeam1 && (userTeam1.player1.id === session.user.id || userTeam1.player2.id === session.user.id)) ||
            (userTeam2 && (userTeam2.player1.id === session.user.id || userTeam2.player2.id === session.user.id))) {
          return bracket;
        }
      }
    }
    return null;
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
      {/* Team Selection Modal for Doubles */}
      {showTeamSelect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-text-primary mb-4">Select Your Team</h3>
            <p className="text-text-secondary mb-4">Choose which team to register for this doubles tournament:</p>
            <div className="space-y-3 mb-6">
              {userTeams.map((team) => {
                const entryFee = calculateEntryFee(team.foreverElo);
                return (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedTeamId === team.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={team.player1.image || undefined}
                        alt={team.player1.name}
                        fallback={team.player1.name.charAt(0)}
                        size="sm"
                      />
                      <span className="text-text-muted">&</span>
                      <Avatar
                        src={team.player2.image || undefined}
                        alt={team.player2.name}
                        fallback={team.player2.name.charAt(0)}
                        size="sm"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">
                          {team.name || `${team.player1.name.split(' ')[0]} & ${team.player2.name.split(' ')[0]}`}
                        </p>
                        <p className="text-sm text-text-muted">
                          {team.player1.name} & {team.player2.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge>{team.foreverElo} ELO</Badge>
                        <p className="text-xs text-accent mt-1">Entry: {entryFee} ELO</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowTeamSelect(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleJoinWithTeam} isLoading={isJoining} disabled={!selectedTeamId} className="flex-1">
                Join Tournament
              </Button>
            </div>
          </Card>
        </div>
      )}

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
                    <p className="text-sm text-text-muted">{loggingMatch.player1.foreverElo || 0} ELO</p>
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
                    <p className="text-sm text-text-muted">{loggingMatch.player2.foreverElo || 0} ELO</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {loggingMatch.player1.name} <span className="text-accent">(Winner)</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max={tournament.maxScore || 21}
                    value={tournament.maxScore || 21}
                    disabled
                    className="text-center text-2xl font-bold bg-accent/10 border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {loggingMatch.player2.name}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max={(tournament.maxScore || 21) - 1}
                    value={scores.player2}
                    onChange={(e) => setScores({ ...scores, player2: e.target.value })}
                    placeholder="0"
                    className="text-center text-2xl font-bold"
                  />
                </div>
              </div>

              <p className="text-center text-sm text-text-muted mt-4">
                Player 1 wins by default. Enter Player 2's score (must be {(tournament.maxScore || 21) - 1} or less)
              </p>

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

            <Card className="p-4 md:p-6">
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

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-6">
                <div className="p-2 md:p-3 lg:p-4 bg-bg-secondary rounded-lg md:rounded-xl text-center">
                  <div className="flex items-center justify-center gap-2 text-accent text-lg font-bold">
                    {tournament.matchType === 'DOUBLES' ? <UsersIcon className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    {tournament.matchType === 'DOUBLES' ? 'Doubles' : 'Singles'}
                  </div>
                  <p className="text-sm text-text-secondary mt-1">Match Type</p>
                </div>
                <div className="p-2 md:p-3 lg:p-4 bg-bg-secondary rounded-lg md:rounded-xl text-center">
                  <div className="text-accent text-lg font-bold">{tournament.format.replace('_', ' ')}</div>
                  <p className="text-sm text-text-secondary mt-1">Format</p>
                </div>
                <div className="p-2 md:p-3 lg:p-4 bg-bg-secondary rounded-lg md:rounded-xl text-center">
                  <div className="text-accent text-lg font-bold">{tournament.participants.length}/{tournament.maxParticipants}</div>
                  <p className="text-sm text-text-secondary mt-1">{tournament.matchType === 'DOUBLES' ? 'Teams' : 'Players'}</p>
                </div>
                <div className="p-2 md:p-3 lg:p-4 bg-bg-secondary rounded-lg md:rounded-xl text-center">
                  <div className="text-accent text-lg font-bold">
                    {isParticipant ? (
                      <span className="text-green-600">Paid</span>
                    ) : userElo !== null ? (
                      tournament.matchType === 'DOUBLES'
                        ? userTeams.length > 0
                          ? userTeams.length === 1
                            ? `${calculateEntryFee(userTeams[0].foreverElo)} ELO`
                            : `${calculateEntryFee(userTeams[0].foreverElo)} | ${calculateEntryFee(userTeams[1].foreverElo)} ELO`
                          : 'Create a team first'
                        : `${calculateEntryFee(userElo)} ELO`
                    ) : (
                      '—'
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mt-1">Your Entry Fee</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mr-auto">
                  <Avatar
                    src={tournament.creator.image}
                    alt={tournament.creator.name}
                    fallback={tournament.creator.name.charAt(0)}
                    size="sm"
                  />
                  <span className="text-xs sm:text-sm text-text-secondary">
                    by {tournament.creator.name}
                  </span>
                </div>

                {tournament.status === 'REGISTRATION_OPEN' && !isParticipant && session?.user && tournament.matchType === 'SINGLES' && (
                  <Button size="sm" onClick={handleJoin} isLoading={isJoining}>
                    <Plus className="h-4 w-4 mr-1" />
                    Join
                  </Button>
                )}

                {tournament.status === 'REGISTRATION_OPEN' && !isParticipant && session?.user && tournament.matchType === 'DOUBLES' && (
                  <Button size="sm" variant="outline" onClick={() => setShowTeamSelect(true)}>
                    <UsersIcon className="h-4 w-4 mr-1" />
                    Join with Team
                  </Button>
                )}

                {tournament.status === 'REGISTRATION_OPEN' && isParticipant && (
                  <Button 
                    size="sm"
                    variant="outline" 
                    onClick={handleLeave}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Leave
                  </Button>
                )}

                {tournament.status === 'REGISTRATION_OPEN' && canEdit && (
                  <Button size="sm" variant="outline" onClick={openEditModal}>
                    <Braces className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}

                {tournament.status === 'REGISTRATION_OPEN' && canEdit && (
                  <Button 
                    size="sm"
                    variant="outline" 
                    onClick={handleCancelTournament}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Cancel
                  </Button>
                )}

                {tournament.status === 'REGISTRATION_OPEN' && (() => {
                  const minParticipants = tournament.format === 'ROUND_ROBIN' ? 3 : 4;
                  const current = tournament.participants.length;
                  const canStart = current >= minParticipants;
                  
                  return (
                    <Button 
                      size="sm"
                      onClick={handleStartTournament} 
                      isLoading={isStarting} 
                      disabled={!canStart}
                      className={`${canStart ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 cursor-not-allowed'}`}
                      title={!canStart ? `Need ${minParticipants} to start (${current}/${minParticipants})` : 'Start Tournament'}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      {canStart ? 'Start' : `${current}/${minParticipants}`}
                    </Button>
                  );
                })()}
              </div>
            </Card>

            {/* Prize Pool */}
            

            {/* Prize Pool */}
            <Card className="p-4 md:p-6 mt-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-accent" />
                    Prize Pool
                  </h3>
                  <p className="text-xs text-text-muted">
                    1st: 50% | 2nd: 35% | 3rd: 15%
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
          {/* Pending Matches */}
          {tournament.status === 'IN_PROGRESS' && (
            <>
              {/* Admin/Creator sees all pending matches */}
              {isAdmin && pendingMatches.length > 0 && (
                <Card className="p-6 mb-6 border-2 border-accent">
                  <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-accent" />
                    All Matches to Log ({pendingMatches.length})
                  </h2>
                  <div className="space-y-2">
                    {pendingMatches.map((bracket) => {
                      const p1 = getParticipantName(bracket.player1Id);
                      const p2 = getParticipantName(bracket.player2Id);
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

              {/* Participant sees only their own pending match */}
              {!isAdmin && getUserPendingMatch() && (
                <Card className="p-6 mb-6 border-2 border-accent">
                  <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-accent" />
                    Your Match
                  </h2>
                  {(() => {
                    const myMatch = getUserPendingMatch();
                    if (!myMatch) return null;
                    const p1 = getParticipantName(myMatch.player1Id);
                    const p2 = getParticipantName(myMatch.player2Id);
                    return (
                      <div 
                        className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg cursor-pointer hover:bg-bg-secondary/80"
                        onClick={() => p1 && p2 && setLoggingMatch({ bracket: myMatch, player1: p1, player2: p2 })}
                      >
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">R{myMatch.round}</Badge>
                          <span className="font-medium">{p1?.name}</span>
                          <span className="text-text-muted">vs</span>
                          <span className="font-medium">{p2?.name}</span>
                        </div>
                        <Button size="sm" variant="outline">Log Result</Button>
                      </div>
                    );
                  })()}
                </Card>
              )}
            </>
          )}

          {/* Participants */}
          <Card className="p-6 mb-6">
            <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              {tournament.matchType === 'DOUBLES' ? <UsersIcon className="h-5 w-5 text-accent" /> : <Users className="h-5 w-5 text-accent" />}
              {tournament.matchType === 'DOUBLES' ? 'Teams' : 'Participants'} ({tournament.participants.length}/{tournament.maxParticipants})
            </h2>

            {tournament.participants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tournament.participants.map((participant, index) => (
                  <div key={participant.id} className="p-4 bg-bg-secondary rounded-xl relative group">
                    {canEdit && tournament.status === 'REGISTRATION_OPEN' && (
                      <button
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-lg font-bold"
                        title="Remove participant"
                      >
                        ×
                      </button>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-accent font-bold text-sm">
                        {index + 1}
                      </div>
                      {tournament.matchType === 'DOUBLES' ? (
                        // Show team participants
                        <>
                          <Avatar
                            src={(participant as TeamParticipant).team.player1.image}
                            alt={(participant as TeamParticipant).team.player1.name}
                            fallback={(participant as TeamParticipant).team.player1.name.charAt(0)}
                            size="sm"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-text-primary text-sm">
                              {(participant as TeamParticipant).team.name || 
                                `${(participant as TeamParticipant).team.player1.name.split(' ')[0]} & ${(participant as TeamParticipant).team.player2.name.split(' ')[0]}`}
                            </p>
                            <p className="text-xs text-text-muted">
                              {(participant as TeamParticipant).team.player1.name} & {(participant as TeamParticipant).team.player2.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-text-primary">{(participant as TeamParticipant).eloAtEntry}</p>
                            <p className="text-xs text-text-muted">Team ELO</p>
                          </div>
                        </>
                      ) : (
                        // Show user participants
                        <>
                          <Avatar
                            src={(participant as UserParticipant).user.image}
                            alt={(participant as UserParticipant).user.name}
                            fallback={(participant as UserParticipant).user.name.charAt(0)}
                            size="sm"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-text-primary text-sm">{(participant as UserParticipant).user.name}</p>
                            <p className="text-xs text-text-muted">{(participant as UserParticipant).user.foreverElo} ELO</p>
                          </div>
                        </>
                      )}
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
                  const p1 = getParticipantName(bracket.player1Id);
                  const p2 = getParticipantName(bracket.player2Id);
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

      {/* Edit Tournament Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 p-2 overflow-y-auto flex items-start justify-center">
          <div className="w-full max-w-sm mx-auto bg-bg-primary rounded-xl shadow-2xl border border-border my-4 overflow-hidden">
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-bold text-text-primary">Edit Tournament</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded hover:bg-bg-secondary transition-colors text-text-muted hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Name</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full h-9 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Optional..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm placeholder:text-text-muted focus:border-accent focus:outline-none resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Entry Fee</label>
                  <Input
                    type="number"
                    min="0"
                    value={editForm.entryFee || 0}
                    onChange={(e) => setEditForm({ ...editForm, entryFee: parseInt(e.target.value) || 0 })}
                    className="w-full h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Max Players</label>
                  <Input
                    type="number"
                    min={2}
                    value={editForm.maxParticipants}
                    onChange={(e) => setEditForm({ ...editForm, maxParticipants: parseInt(e.target.value) || 4 })}
                    className="w-full h-9 text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Play To</label>
                  <select
                    value={editForm.maxScore || 21}
                    onChange={(e) => setEditForm({ ...editForm, maxScore: parseInt(e.target.value) })}
                    className="w-full h-9 px-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm focus:border-accent focus:outline-none"
                  >
                    <option value={7}>7 pts</option>
                    <option value={11}>11 pts</option>
                    <option value={15}>15 pts</option>
                    <option value={21}>21 pts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Start Time</label>
                  <Input
                    type="datetime-local"
                    value={editForm.startsAt}
                    onChange={(e) => setEditForm({ ...editForm, startsAt: e.target.value })}
                    className="w-full h-9 text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-3 py-2.5 border-t border-border flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowEditModal(false)} className="flex-1 h-9 text-sm">
                Cancel
              </Button>
              <Button size="sm" onClick={handleEditTournament} isLoading={isEditing} className="flex-1 h-9 text-sm">
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
