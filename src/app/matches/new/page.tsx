'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EloBadge } from '@/components/elo/EloBadge';
import { Trophy, Users, User, ArrowRight, Check, X, Zap } from 'lucide-react';

type MatchType = 'SINGLES' | 'DOUBLES';

interface Player {
  id: string;
  name: string;
  image?: string | null;
  foreverElo: number;
}

// ============================================
// Log Match Page
// ============================================

export default function LogMatchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matchType, setMatchType] = useState<MatchType>('SINGLES');
  const [players, setPlayers] = useState<Player[]>([]);
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const [team1Player1, setTeam1Player1] = useState<Player | null>(null);
  const [team1Player2, setTeam1Player2] = useState<Player | null>(null);
  const [team2Player1, setTeam2Player1] = useState<Player | null>(null);
  const [team2Player2, setTeam2Player2] = useState<Player | null>(null);
  const [player1Score, setPlayer1Score] = useState<string>('');
  const [player2Score, setPlayer2Score] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      redirect('/auth/signin');
    }
  }, [session, status]);

  useEffect(() => {
    async function fetchPlayers() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/users?includeStats=true');
        if (res.ok) {
          const data = await res.json();
          setPlayers(data.users || []);
        }
      } catch (error) {
        console.error('Failed to fetch players:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlayers();
  }, []);

  const handleSubmit = async () => {
    if (!session?.user) return;
    
    const p1Score = parseInt(player1Score);
    const p2Score = parseInt(player2Score);
    
    if (isNaN(p1Score) || isNaN(p2Score) || p1Score < 0 || p2Score < 0) {
      setError('Please enter valid scores');
      return;
    }

    if (matchType === 'SINGLES') {
      if (!player1 || !player2) {
        setError('Please select both players');
        return;
      }
    } else {
      if (!team1Player1 || !team1Player2 || !team2Player1 || !team2Player2) {
        setError('Please select all team members');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const body: any = {
        matchType,
        player1Score: p1Score,
        player2Score: p2Score,
      };

      if (matchType === 'SINGLES') {
        body.player1Id = player1!.id;
        body.player2Id = player2!.id;
      } else {
        body.team1Player1Id = team1Player1!.id;
        body.team1Player2Id = team1Player2!.id;
        body.team2Player1Id = team2Player1!.id;
        body.team2Player2Id = team2Player2!.id;
      }

      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to log match');
      }
    } catch (error) {
      setError('Failed to log match');
    } finally {
      setIsSubmitting(false);
    }
  };

  const excludeIds = matchType === 'SINGLES' 
    ? (player1 ? [player1.id] : [])
    : (team1Player1 && team1Player2 ? [team1Player1.id, team1Player2.id] : []);

  const excludeIds2 = matchType === 'SINGLES'
    ? (player2 ? [player2.id] : [])
    : (team2Player1 && team2Player2 ? [team2Player1.id, team2Player2.id] : []);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
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
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-text-primary text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Log a Match
            </h1>
            <p className="text-text-secondary mx-auto mt-4 max-w-2xl text-lg md:text-xl">
              Record your ping pong match and update the leaderboard
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          {/* Match Type Selector */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex h-12 items-center justify-center rounded-lg bg-bg-secondary p-1">
              <button
                onClick={() => {
                  setMatchType('SINGLES');
                  setPlayer1(null);
                  setPlayer2(null);
                  setTeam1Player1(null);
                  setTeam1Player2(null);
                  setTeam2Player1(null);
                  setTeam2Player2(null);
                }}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium transition-all ${
                  matchType === 'SINGLES'
                    ? 'bg-bg-primary text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <User className="h-4 w-4" />
                Singles
              </button>
              <button
                onClick={() => {
                  setMatchType('DOUBLES');
                  setPlayer1(null);
                  setPlayer2(null);
                  setTeam1Player1(null);
                  setTeam1Player2(null);
                  setTeam2Player1(null);
                  setTeam2Player2(null);
                }}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium transition-all ${
                  matchType === 'DOUBLES'
                    ? 'bg-bg-primary text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Users className="h-4 w-4" />
                Doubles
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="p-4 mb-6 border-red-500/50 bg-red-500/10">
              <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
            </Card>
          )}

          {/* Singles Match */}
          {matchType === 'SINGLES' && (
            <div className="space-y-6">
              {/* Player Selection */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-text-primary">Select Players</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Player 1 */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Player 1 (Winner)
                    </label>
                    <select
                      className="w-full h-12 px-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      value={player1?.id || ''}
                      onChange={(e) => {
                        const p = players.find(pl => pl.id === e.target.value);
                        setPlayer1(p || null);
                      }}
                    >
                      <option value="">Select Player</option>
                      {players.filter(p => p.id !== player2?.id).map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.foreverElo} ELO)
                        </option>
                      ))}
                    </select>
                    {player1 && (
                      <div className="mt-2 p-3 bg-bg-secondary rounded-lg flex items-center gap-3">
                        <Avatar
                          src={player1.image}
                          alt={player1.name}
                          fallback={player1.name.charAt(0)}
                          size="md"
                        />
                        <div>
                          <p className="font-medium text-text-primary">{player1.name}</p>
                          <EloBadge elo={player1.foreverElo} size="sm" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Player 2 */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Player 2
                    </label>
                    <select
                      className="w-full h-12 px-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      value={player2?.id || ''}
                      onChange={(e) => {
                        const p = players.find(pl => pl.id === e.target.value);
                        setPlayer2(p || null);
                      }}
                    >
                      <option value="">Select Player</option>
                      {players.filter(p => p.id !== player1?.id).map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.foreverElo} ELO)
                        </option>
                      ))}
                    </select>
                    {player2 && (
                      <div className="mt-2 p-3 bg-bg-secondary rounded-lg flex items-center gap-3">
                        <Avatar
                          src={player2.image}
                          alt={player2.name}
                          fallback={player2.name.charAt(0)}
                          size="md"
                        />
                        <div>
                          <p className="font-medium text-text-primary">{player2.name}</p>
                          <EloBadge elo={player2.foreverElo} size="sm" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Score Entry */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-text-primary">Enter Score</h2>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <p className="text-sm text-text-secondary mb-2">{player1?.name || 'Player 1'}</p>
                    <Input
                      type="number"
                      min="0"
                      max="21"
                      placeholder="0"
                      value={player1Score}
                      onChange={(e) => setPlayer1Score(e.target.value)}
                      className="text-center text-2xl font-bold h-16"
                    />
                  </div>
                  <div className="text-center text-text-muted text-2xl">-</div>
                  <div className="text-center">
                    <p className="text-sm text-text-secondary mb-2">{player2?.name || 'Player 2'}</p>
                    <Input
                      type="number"
                      min="0"
                      max="21"
                      placeholder="0"
                      value={player2Score}
                      onChange={(e) => setPlayer2Score(e.target.value)}
                      className="text-center text-2xl font-bold h-16"
                    />
                  </div>
                </div>
                <p className="text-center text-sm text-text-muted mt-4">
                  Winner must have at least 3 points and win by 2
                </p>
              </Card>
            </div>
          )}

          {/* Doubles Match */}
          {matchType === 'DOUBLES' && (
            <div className="space-y-6">
              {/* Team 1 */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-text-primary flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  Team 1 (Winner)
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Player 1</label>
                    <select
                      className="w-full h-12 px-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:outline-none"
                      value={team1Player1?.id || ''}
                      onChange={(e) => {
                        const p = players.find(pl => pl.id === e.target.value);
                        setTeam1Player1(p || null);
                      }}
                    >
                      <option value="">Select</option>
                      {players.filter(p => p.id !== team1Player2?.id && p.id !== team2Player1?.id && p.id !== team2Player2?.id).map((player) => (
                        <option key={player.id} value={player.id}>{player.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Player 2</label>
                    <select
                      className="w-full h-12 px-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:outline-none"
                      value={team1Player2?.id || ''}
                      onChange={(e) => {
                        const p = players.find(pl => pl.id === e.target.value);
                        setTeam1Player2(p || null);
                      }}
                    >
                      <option value="">Select</option>
                      {players.filter(p => p.id !== team1Player1?.id && p.id !== team2Player1?.id && p.id !== team2Player2?.id).map((player) => (
                        <option key={player.id} value={player.id}>{player.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>

              {/* Team 2 */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-text-primary">Team 2</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Player 1</label>
                    <select
                      className="w-full h-12 px-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:outline-none"
                      value={team2Player1?.id || ''}
                      onChange={(e) => {
                        const p = players.find(pl => pl.id === e.target.value);
                        setTeam2Player1(p || null);
                      }}
                    >
                      <option value="">Select</option>
                      {players.filter(p => p.id !== team1Player1?.id && p.id !== team1Player2?.id && p.id !== team2Player2?.id).map((player) => (
                        <option key={player.id} value={player.id}>{player.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Player 2</label>
                    <select
                      className="w-full h-12 px-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:outline-none"
                      value={team2Player2?.id || ''}
                      onChange={(e) => {
                        const p = players.find(pl => pl.id === e.target.value);
                        setTeam2Player2(p || null);
                      }}
                    >
                      <option value="">Select</option>
                      {players.filter(p => p.id !== team1Player1?.id && p.id !== team1Player2?.id && p.id !== team2Player1?.id).map((player) => (
                        <option key={player.id} value={player.id}>{player.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>

              {/* Score Entry */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-text-primary">Enter Score</h2>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <p className="text-sm text-text-secondary mb-2">
                      {team1Player1 && team1Player2 ? `${team1Player1.name} & ${team1Player2.name}` : 'Team 1'}
                    </p>
                    <Input
                      type="number"
                      min="0"
                      max="21"
                      placeholder="0"
                      value={player1Score}
                      onChange={(e) => setPlayer1Score(e.target.value)}
                      className="text-center text-2xl font-bold h-16"
                    />
                  </div>
                  <div className="text-center text-text-muted text-2xl">-</div>
                  <div className="text-center">
                    <p className="text-sm text-text-secondary mb-2">
                      {team2Player1 && team2Player2 ? `${team2Player1.name} & ${team2Player2.name}` : 'Team 2'}
                    </p>
                    <Input
                      type="number"
                      min="0"
                      max="21"
                      placeholder="0"
                      value={player2Score}
                      onChange={(e) => setPlayer2Score(e.target.value)}
                      className="text-center text-2xl font-bold h-16"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="min-w-[200px]"
            >
              <Check className="h-5 w-5 mr-2" />
              Log Match
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
