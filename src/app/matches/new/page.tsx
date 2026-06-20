'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  Users, 
  Plus, 
  Minus, 
  Trophy,
  ArrowRight,
  Loader2,
  CheckCircle
} from 'lucide-react';

// ============================================
// Match Logging Page
// ============================================

// Mock players for demo - in production would fetch from API
const mockPlayers = [
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
  
  const [step, setStep] = useState<'select' | 'score' | 'confirm' | 'success'>('select');
  const [player1, setPlayer1] = useState<typeof mockPlayers[0] | null>(null);
  const [player2, setPlayer2] = useState<typeof mockPlayers[0] | null>(null);
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/signin?callbackUrl=/matches/new");
    return null;
  }

  // Auto-select current user as player 1
  if (!player1 && session?.user && step === 'select') {
    const currentUser = mockPlayers.find(p => p.name === 'You');
    if (currentUser) {
      setPlayer1(currentUser);
    }
  }

  const handleSelectPlayer1 = (player: typeof mockPlayers[0]) => {
    setPlayer1(player);
    setError('');
  };

  const handleSelectPlayer2 = (player: typeof mockPlayers[0]) => {
    setPlayer2(player);
    setError('');
  };

  const handleNextToScore = () => {
    if (!player1 || !player2) {
      setError('Please select both players');
      return;
    }
    if (player1.id === player2.id) {
      setError('Please select two different players');
      return;
    }
    setError('');
    setStep('score');
  };

  const handleNextToConfirm = () => {
    // Validate scores
    if (player1Score < 3 || player2Score < 3) {
      setError('Both players must have at least 3 points');
      return;
    }
    if (player1Score > 21 || player2Score > 21) {
      setError('Scores cannot exceed 21 points');
      return;
    }
    if (Math.abs(player1Score - player2Score) < 2 && Math.max(player1Score, player2Score) === 21) {
      setError('Winner must win by at least 2 points');
      return;
    }
    if (player1Score < 11 && player2Score < 11) {
      setError('Winner must have at least 11 points');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1Id: player1?.id,
          player2Id: player2?.id,
          player1Score,
          player2Score,
        }),
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

  const winner = player1Score > player2Score ? player1 : player2;
  const scoreMargin = Math.abs(player1Score - player2Score);
  const marginMultiplier = scoreMargin >= 10 ? 1.5 : scoreMargin >= 5 ? 1.25 : 1.0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step === 'select' || step === 'score' || step === 'confirm' || step === 'success'
              ? 'bg-accent text-white' 
              : 'bg-bg-secondary text-text-secondary'
          }`}>
            {step !== 'select' ? <CheckCircle className="h-5 w-5" /> : '1'}
          </div>
          <div className={`w-12 h-1 ${step !== 'select' ? 'bg-accent' : 'bg-bg-secondary'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step === 'score' || step === 'confirm' || step === 'success'
              ? 'bg-accent text-white' 
              : 'bg-bg-secondary text-text-secondary'
          }`}>
            {step === 'confirm' || step === 'success' ? <CheckCircle className="h-5 w-5" /> : '2'}
          </div>
          <div className={`w-12 h-1 ${step === 'confirm' || step === 'success' ? 'bg-accent' : 'bg-bg-secondary'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step === 'confirm' || step === 'success'
              ? 'bg-accent text-white' 
              : 'bg-bg-secondary text-text-secondary'
          }`}>
            {step === 'success' ? <CheckCircle className="h-5 w-5" /> : '3'}
          </div>
        </div>
      </div>

      {/* Step 1: Select Players */}
      {step === 'select' && (
        <>
          <PageHeader
            title="Log a Match"
            description="Select the two players who competed"
          />

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Player 1 */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center text-sm">1</span>
                Player 1 (Winner)
              </h3>
              <div className="space-y-2">
                {mockPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleSelectPlayer1(player)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      player1?.id === player.id
                        ? 'border-accent bg-accent/5'
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

            {/* Player 2 */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-bg-secondary text-text-secondary rounded-full flex items-center justify-center text-sm">2</span>
                Player 2 (Loser)
              </h3>
              <div className="space-y-2">
                {mockPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleSelectPlayer2(player)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      player2?.id === player.id
                        ? 'border-accent bg-accent/5'
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
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleNextToScore}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              disabled={!player1 || !player2 || player1.id === player2.id}
            >
              Continue to Score
            </Button>
          </div>
        </>
      )}

      {/* Step 2: Enter Score */}
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
              {/* Player 1 */}
              <div className="text-center">
                <p className="font-medium text-text-secondary mb-4">{player1?.name}</p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setPlayer1Score(Math.max(0, player1Score - 1))}
                    className="w-12 h-12 bg-bg-secondary rounded-full flex items-center justify-center hover:bg-bg-primary transition-colors"
                  >
                    <Minus className="h-6 w-6" />
                  </button>
                  <span className="text-6xl font-bold text-text-primary w-20">
                    {player1Score}
                  </span>
                  <button
                    onClick={() => setPlayer1Score(Math.min(30, player1Score + 1))}
                    className="w-12 h-12 bg-bg-secondary rounded-full flex items-center justify-center hover:bg-bg-primary transition-colors"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
                <Badge variant="outline" className="mt-2">{player1?.elo} ELO</Badge>
              </div>

              {/* VS Divider */}
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-accent">VS</span>
                </div>
              </div>

              {/* Player 2 */}
              <div className="text-center">
                <p className="font-medium text-text-secondary mb-4">{player2?.name}</p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setPlayer2Score(Math.max(0, player2Score - 1))}
                    className="w-12 h-12 bg-bg-secondary rounded-full flex items-center justify-center hover:bg-bg-primary transition-colors"
                  >
                    <Minus className="h-6 w-6" />
                  </button>
                  <span className="text-6xl font-bold text-text-primary w-20">
                    {player2Score}
                  </span>
                  <button
                    onClick={() => setPlayer2Score(Math.min(30, player2Score + 1))}
                    className="w-12 h-12 bg-bg-secondary rounded-full flex items-center justify-center hover:bg-bg-primary transition-colors"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
                <Badge variant="outline" className="mt-2">{player2?.elo} ELO</Badge>
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

      {/* Step 3: Confirm */}
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
                <span className="font-semibold">{winner?.name} wins!</span>
              </div>
              <div className="flex items-center justify-center gap-8 text-5xl font-bold">
                <span className={player1Score > player2Score ? 'text-accent' : 'text-text-secondary'}>
                  {player1Score}
                </span>
                <span className="text-text-muted">-</span>
                <span className={player2Score > player1Score ? 'text-accent' : 'text-text-secondary'}>
                  {player2Score}
                </span>
              </div>
            </div>

            {/* Match Details */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="text-center p-4 bg-bg-secondary rounded-xl">
                <p className="text-sm text-text-secondary mb-1">{player1?.name}</p>
                <p className="font-semibold">{player1?.elo} ELO</p>
              </div>
              <div className="text-center p-4 bg-bg-secondary rounded-xl">
                <p className="text-sm text-text-secondary mb-1">{player2?.name}</p>
                <p className="font-semibold">{player2?.elo} ELO</p>
              </div>
            </div>

            {/* Match Info */}
            <div className="text-center text-sm text-text-secondary space-y-1">
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
            Great job! {winner?.name} won {player1Score > player2Score ? player1Score : player2Score}-{player1Score > player2Score ? player2Score : player1Score}. 
            The ELO ratings have been updated.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline">
                Back to Dashboard
              </Button>
            </Link>
            <Link href="/matches/new">
              <Button onClick={() => {
                setStep('select');
                setPlayer1Score(0);
                setPlayer2Score(0);
              }}>
                Log Another Match
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
