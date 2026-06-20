'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  User,
  Users, 
  Plus, 
  Minus, 
  Trophy,
  ArrowRight,
  CheckCircle,
  UserPlus
} from 'lucide-react';

// ============================================
// Match Logging Page - Singles & Doubles
// ============================================

type MatchType = 'SINGLES' | 'DOUBLES';

interface Player {
  id: string;
  name: string;
  elo: number;
}

// Mock players for demo - in production would fetch from API
const mockPlayers: Player[] = [
  { id: '1', name: 'You', elo: 1042 },
  { id: '2', name: 'Alex Chen', elo: 1285 },
  { id: '3', name: 'Sarah Miller', elo: 1240 },
  { id: '4', name: 'Mike Johnson', elo: 1198 },
  { id: '5', name: 'Emma Wilson', elo: 1156 },
  { id: '6', name: 'James Brown', elo: 1105 },
  { id: '7', name: 'Lisa Davis', elo: 1050 },
  { id: '8', name: 'Tom Anderson', elo: 980 },
];

export default function NewMatchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Match type selection
  const [matchType, setMatchType] = useState<MatchType>('SINGLES');
  
  // Singles state
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  
  // Doubles state
  const [team1Player1, setTeam1Player1] = useState<Player | null>(null);
  const [team1Player2, setTeam1Player2] = useState<Player | null>(null);
  const [team2Player1, setTeam2Player1] = useState<Player | null>(null);
  const [team2Player2, setTeam2Player2] = useState<Player | null>(null);
  
  // Score state
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  
  // UI state
  const [step, setStep] = useState<'type' | 'select' | 'score' | 'confirm' | 'success'>('type');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/signin?callbackUrl=/matches/new");
    return null;
  }

  const resetState = () => {
    setPlayer1(null);
    setPlayer2(null);
    setTeam1Player1(null);
    setTeam1Player2(null);
    setTeam2Player1(null);
    setTeam2Player2(null);
    setTeam1Score(0);
    setTeam2Score(0);
    setStep('type');
    setError('');
  };

  const handleSelectMatchType = (type: MatchType) => {
    setMatchType(type);
    setStep('select');
  };

  const handleNextToScore = () => {
    setError('');
    
    if (matchType === 'SINGLES') {
      if (!player1 || !player2) {
        setError('Please select both players');
        return;
      }
      if (player1.id === player2.id) {
        setError('Please select two different players');
        return;
      }
    } else {
      // Doubles validation
      if (!team1Player1 || !team1Player2 || !team2Player1 || !team2Player2) {
        setError('Please select all 4 players');
        return;
      }
      const allIds = [team1Player1.id, team1Player2.id, team2Player1.id, team2Player2.id];
      const uniqueIds = new Set(allIds);
      if (uniqueIds.size !== 4) {
        setError('Each player must be unique');
        return;
      }
    }
    
    setStep('score');
  };

  const handleNextToConfirm = () => {
    setError('');
    
    // Validate scores
    if (team1Score < 3 || team2Score < 3) {
      setError('Both teams must have at least 3 points');
      return;
    }
    if (team1Score > 30 || team2Score > 30) {
      setError('Scores cannot exceed 30 points');
      return;
    }
    if (Math.abs(team1Score - team2Score) < 2 && Math.max(team1Score, team2Score) === 21) {
      setError('Winner must win by at least 2 points');
      return;
    }
    if (team1Score < 11 && team2Score < 11) {
      setError('Winner must have at least 11 points');
      return;
    }
    
    setStep('confirm');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const payload = matchType === 'SINGLES' 
        ? {
            matchType: 'SINGLES',
            player1Id: player1?.id,
            player2Id: player2?.id,
            player1Score: team1Score,
            player2Score: team2Score,
          }
        : {
            matchType: 'DOUBLES',
            team1Player1Id: team1Player1?.id,
            team1Player2Id: team1Player2?.id,
            team2Player1Id: team2Player1?.id,
            team2Player2Id: team2Player2?.id,
            player1Score: team1Score,
            player2Score: team2Score,
          };

      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create match');
      }

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const team1Won = team1Score > team2Score;
  const winner: string = matchType === 'SINGLES' 
    ? (team1Won ? player1?.name : player2?.name) || ''
    : (team1Won ? `${team1Player1?.name} & ${team1Player2?.name}` : `${team2Player1?.name} & ${team2Player2?.name}`) || '';
  
  const scoreMargin = Math.abs(team1Score - team2Score);
  const marginMultiplier = scoreMargin >= 10 ? 1.5 : scoreMargin >= 5 ? 1.25 : 1.0;

  const availablePlayers = (selectedIds: string[]) => 
    mockPlayers.filter(p => !selectedIds.includes(p.id));

  // Player Selection Component
  const PlayerSelector = ({ 
    label, 
    selected, 
    onSelect, 
    teamLabel,
    excludeIds = [],
    disabled = false
  }: { 
    label: string; 
    selected: Player | null; 
    onSelect: (p: Player) => void;
    teamLabel: string;
    excludeIds?: string[];
    disabled?: boolean;
  }) => (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
          selected ? 'bg-accent text-white' : 'bg-bg-secondary text-text-secondary'
        }`}>
          {selected ? <CheckCircle className="h-5 w-5" /> : teamLabel}
        </span>
        {label}
      </h3>
      <div className="space-y-2">
        {mockPlayers.filter(p => !excludeIds.includes(p.id) || p.id === selected?.id).map((player) => (
          <button
            key={player.id}
            onClick={() => !disabled && onSelect(player)}
            disabled={disabled || excludeIds.includes(player.id)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              selected?.id === player.id
                ? 'border-accent bg-accent/5'
                : disabled || excludeIds.includes(player.id)
                  ? 'border-border opacity-50 cursor-not-allowed'
                  : 'border-border hover:border-accent/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{player.name}</span>
              <Badge variant="outline">{player.elo} ELO</Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Step 1: Select Match Type */}
      {step === 'type' && (
        <>
          <PageHeader
            title="Log a Match"
            description="Choose the type of match you want to record"
          />
          
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Card 
              className={`p-8 text-center cursor-pointer transition-all ${
                matchType === 'SINGLES' ? 'ring-2 ring-accent' : 'hover:border-accent'
              }`}
              onClick={() => handleSelectMatchType('SINGLES')}
            >
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">Singles</h3>
              <p className="text-text-secondary text-sm">
                1 vs 1 match between two players
              </p>
            </Card>
            
            <Card 
              className={`p-8 text-center cursor-pointer transition-all ${
                matchType === 'DOUBLES' ? 'ring-2 ring-accent' : 'hover:border-accent'
              }`}
              onClick={() => handleSelectMatchType('DOUBLES')}
            >
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Doubles</h3>
              <p className="text-text-secondary text-sm">
                2 vs 2 team match with partners
              </p>
            </Card>
          </div>
        </>
      )}

      {/* Step 2: Select Players */}
      {step === 'select' && (
        <>
          <PageHeader
            title={`Log a ${matchType === 'SINGLES' ? 'Singles' : 'Doubles'} Match`}
            description={matchType === 'SINGLES' 
              ? "Select the two players who competed"
              : "Select the four players (two teams)"
            }
          />

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {matchType === 'SINGLES' ? (
            /* Singles Player Selection */
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <PlayerSelector
                label="Player 1 (Winner)"
                selected={player1}
                onSelect={setPlayer1}
                teamLabel="1"
                excludeIds={player2 ? [player2.id] : []}
              />
              <PlayerSelector
                label="Player 2 (Loser)"
                selected={player2}
                onSelect={setPlayer2}
                teamLabel="2"
                excludeIds={player1 ? [player1.id] : []}
              />
            </div>
          ) : (
            /* Doubles Player Selection */
            <>
              {/* Team 1 */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center font-bold">
                    T1
                  </div>
                  <h2 className="text-xl font-bold">Team 1 (Winner)</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <PlayerSelector
                    label="Player 1"
                    selected={team1Player1}
                    onSelect={setTeam1Player1}
                    teamLabel="1"
                    excludeIds={[
                      team1Player2?.id, 
                      team2Player1?.id, 
                      team2Player2?.id
                    ].filter(Boolean) as string[]}
                  />
                  <PlayerSelector
                    label="Player 2"
                    selected={team1Player2}
                    onSelect={setTeam1Player2}
                    teamLabel="2"
                    excludeIds={[
                      team1Player1?.id, 
                      team2Player1?.id, 
                      team2Player2?.id
                    ].filter(Boolean) as string[]}
                  />
                </div>
              </div>

              {/* Team 2 */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-500/10 text-red-600 rounded-full flex items-center justify-center font-bold">
                    T2
                  </div>
                  <h2 className="text-xl font-bold">Team 2 (Loser)</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <PlayerSelector
                    label="Player 1"
                    selected={team2Player1}
                    onSelect={setTeam2Player1}
                    teamLabel="1"
                    excludeIds={[
                      team1Player1?.id, 
                      team1Player2?.id, 
                      team2Player2?.id
                    ].filter(Boolean) as string[]}
                  />
                  <PlayerSelector
                    label="Player 2"
                    selected={team2Player2}
                    onSelect={setTeam2Player2}
                    teamLabel="2"
                    excludeIds={[
                      team1Player1?.id, 
                      team1Player2?.id, 
                      team2Player1?.id
                    ].filter(Boolean) as string[]}
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={resetState}>
              Back
            </Button>
            <Button onClick={handleNextToScore}>
              Continue to Score
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Enter Score */}
      {step === 'score' && (
        <>
          <PageHeader
            title="Enter the Score"
            description="Record the final score of the match"
          />

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Card className="p-8 mb-8">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Team 1 */}
              <div className="text-center">
                <div className="mb-2">
                  {matchType === 'DOUBLES' ? (
                    <Badge variant="success">Team 1</Badge>
                  ) : null}
                </div>
                <p className="font-medium text-text-secondary mb-4">
                  {matchType === 'SINGLES' 
                    ? player1?.name
                    : `${team1Player1?.name} & ${team1Player2?.name}`
                  }
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setTeam1Score(Math.max(0, team1Score - 1))}
                    className="w-12 h-12 bg-bg-secondary rounded-full flex items-center justify-center hover:bg-bg-primary transition-colors"
                  >
                    <Minus className="h-6 w-6" />
                  </button>
                  <span className="text-6xl font-bold text-text-primary w-20">
                    {team1Score}
                  </span>
                  <button
                    onClick={() => setTeam1Score(Math.min(30, team1Score + 1))}
                    className="w-12 h-12 bg-bg-secondary rounded-full flex items-center justify-center hover:bg-bg-primary transition-colors"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
                <Badge variant="outline" className="mt-2">
                  {matchType === 'SINGLES' 
                    ? `${player1?.elo} ELO`
                    : `Avg: ${Math.round(((team1Player1?.elo || 0) + (team1Player2?.elo || 0)) / 2)} ELO`
                  }
                </Badge>
              </div>

              {/* VS Divider */}
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-accent">VS</span>
                </div>
              </div>

              {/* Team 2 */}
              <div className="text-center">
                <div className="mb-2">
                  {matchType === 'DOUBLES' ? (
                    <Badge variant="danger">Team 2</Badge>
                  ) : null}
                </div>
                <p className="font-medium text-text-secondary mb-4">
                  {matchType === 'SINGLES' 
                    ? player2?.name
                    : `${team2Player1?.name} & ${team2Player2?.name}`
                  }
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setTeam2Score(Math.max(0, team2Score - 1))}
                    className="w-12 h-12 bg-bg-secondary rounded-full flex items-center justify-center hover:bg-bg-primary transition-colors"
                  >
                    <Minus className="h-6 w-6" />
                  </button>
                  <span className="text-6xl font-bold text-text-primary w-20">
                    {team2Score}
                  </span>
                  <button
                    onClick={() => setTeam2Score(Math.min(30, team2Score + 1))}
                    className="w-12 h-12 bg-bg-secondary rounded-full flex items-center justify-center hover:bg-bg-primary transition-colors"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
                <Badge variant="outline" className="mt-2">
                  {matchType === 'SINGLES' 
                    ? `${player2?.elo} ELO`
                    : `Avg: ${Math.round(((team2Player1?.elo || 0) + (team2Player2?.elo || 0)) / 2)} ELO`
                  }
                </Badge>
              </div>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('select')}>
              Back
            </Button>
            <Button onClick={handleNextToConfirm}>
              Review Match
            </Button>
          </div>
        </>
      )}

      {/* Step 4: Confirm */}
      {step === 'confirm' && (
        <>
          <PageHeader
            title="Confirm Match"
            description="Review the match details before submitting"
          />

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Card className="p-8 mb-8">
            {/* Winner Announcement */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-full mb-4">
                <Trophy className="h-5 w-5" />
                <span className="font-semibold">{winner} wins!</span>
              </div>
              <div className="flex items-center justify-center gap-8 text-5xl font-bold">
                <span className={team1Won ? 'text-accent' : 'text-text-secondary'}>
                  {team1Score}
                </span>
                <span className="text-text-muted">-</span>
                <span className={!team1Won ? 'text-accent' : 'text-text-secondary'}>
                  {team2Score}
                </span>
              </div>
            </div>

            {/* Match Details */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="text-center p-4 bg-bg-secondary rounded-xl">
                <Badge variant="success" className="mb-2">Team 1</Badge>
                <p className="font-medium">
                  {matchType === 'SINGLES' 
                    ? player1?.name
                    : `${team1Player1?.name} & ${team1Player2?.name}`
                  }
                </p>
              </div>
              <div className="text-center p-4 bg-bg-secondary rounded-xl">
                <Badge variant="danger" className="mb-2">Team 2</Badge>
                <p className="font-medium">
                  {matchType === 'SINGLES' 
                    ? player2?.name
                    : `${team2Player1?.name} & ${team2Player2?.name}`
                  }
                </p>
              </div>
            </div>

            {/* Match Info */}
            <div className="text-center text-sm text-text-secondary space-y-1">
              <p>Match type: <strong>{matchType}</strong></p>
              <p>Score margin: <strong>{scoreMargin} points</strong></p>
              <p>Margin multiplier: <strong>{marginMultiplier}x</strong> (casual match)</p>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('score')}>
              Back
            </Button>
            <Button 
              onClick={handleSubmit}
              isLoading={isLoading}
              leftIcon={<Trophy className="h-4 w-4" />}
            >
              Log Match
            </Button>
          </div>
        </>
      )}

      {/* Success */}
      {step === 'success' && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-4">
            Match Logged!
          </h1>
          <p className="text-text-secondary mb-8 max-w-md mx-auto">
            {winner} won {Math.max(team1Score, team2Score)}-{Math.min(team1Score, team2Score)}. 
            The {matchType === 'SINGLES' ? 'ELO ratings' : 'doubles ELO ratings'} have been updated.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline">
                Back to Dashboard
              </Button>
            </Link>
            <Button onClick={resetState}>
              Log Another Match
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
