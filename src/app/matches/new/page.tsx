'use client';

import { PageHero } from '@/components/layout/PageHero';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EloBadge } from '@/components/elo/EloBadge';
import { Trophy, Users, User, Check, Zap, Shuffle } from 'lucide-react';

type MatchType = 'SINGLES' | 'DOUBLES';
type DoublesMode = 'teams' | 'adhoc';

interface Player {
  id: string;
  name: string;
  image?: string | null;
  foreverElo: number;
  doublesForeverElo?: number;
}

interface Team {
  id: string;
  name: string | null;
  foreverElo: number;
  wins: number;
  losses: number;
  player1: Player;
  player2: Player;
}

export default function LogMatchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matchType, setMatchType] = useState<MatchType>('SINGLES');
  const [doublesMode, setDoublesMode] = useState<DoublesMode>('teams');
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  // Singles state
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  
  // Team-based doubles state
  const [team1, setTeam1] = useState<Team | null>(null);
  const [team2, setTeam2] = useState<Team | null>(null);
  
  // Ad-hoc doubles state (4 individual players)
  const [team1Player1, setTeam1Player1] = useState<Player | null>(null);
  const [team1Player2, setTeam1Player2] = useState<Player | null>(null);
  const [team2Player1, setTeam2Player1] = useState<Player | null>(null);
  const [team2Player2, setTeam2Player2] = useState<Player | null>(null);
  
  const [player1Score, setPlayer1Score] = useState<string>('');
  const [player2Score, setPlayer2Score] = useState<string>('');
  const [maxScore, setMaxScore] = useState<number>(21);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Match result state for celebrations
  const [matchResult, setMatchResult] = useState<{
    won: boolean;
    eloGained: number;
    streakBonus: number;
    newStreak: number;
    milestone: number | null;
  } | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      redirect('/auth/signin');
    }
  }, [session, status]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [usersRes, teamsRes] = await Promise.all([
          fetch('/api/users?includeStats=true'),
          fetch('/api/teams'),
        ]);
        if (usersRes.ok) {
          const data = await usersRes.json();
          setPlayers(data.users || []);
        }
        if (teamsRes.ok) {
          const data = await teamsRes.json();
          setTeams(data.teams || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
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
      if (doublesMode === 'teams') {
        if (!team1 || !team2) {
          setError('Please select both teams');
          return;
        }
      } else {
        // Ad-hoc doubles
        if (!team1Player1 || !team1Player2 || !team2Player1 || !team2Player2) {
          setError('Please select all 4 players');
          return;
        }
        // Check for duplicates
        const ids = [team1Player1.id, team1Player2.id, team2Player1.id, team2Player2.id];
        if (new Set(ids).size !== 4) {
          setError('All 4 players must be different');
          return;
        }
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const body: any = {
        matchType,
        player1Score: p1Score,
        player2Score: p2Score,
        maxScore,
      };

      if (matchType === 'SINGLES') {
        body.player1Id = player1!.id;
        body.player2Id = player2!.id;
      } else if (doublesMode === 'teams') {
        body.team1Id = team1!.id;
        body.team2Id = team2!.id;
      } else {
        // Ad-hoc doubles - pass individual player IDs
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
        const data = await res.json();
        
        // Check if the logged-in user won
        const userId = session?.user?.id;
        let won = false;
        let eloGained = 0;
        let streakBonus = 0;
        let newStreak = 0;
        let milestone: number | null = null;
        
        if (data.match?.winnerId === userId) {
          won = true;
        }
        
        // Get ELO change for logged-in user
        if (data.match?.player1Id === userId) {
          eloGained = data.match?.player1EloChange || data.eloChange?.player1Change || 0;
        } else if (data.match?.player2Id === userId) {
          eloGained = data.match?.player2EloChange || data.eloChange?.player2Change || 0;
        }
        
        // Get streak info for logged-in user
        if (data.newStreak) {
          if (data.match?.player1Id === userId) {
            streakBonus = data.streakBonus?.player1 || 0;
            newStreak = data.newStreak?.player1 || 0;
            milestone = data.milestone?.player1 || null;
          } else if (data.match?.player2Id === userId) {
            streakBonus = data.streakBonus?.player2 || 0;
            newStreak = data.newStreak?.player2 || 0;
            milestone = data.milestone?.player2 || null;
          }
        }
        
        // Set match result for celebration
        setMatchResult({ won, eloGained, streakBonus, newStreak, milestone });
        
        // Trigger confetti based on result
        if (won) {
          // Regular win - small confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#22c55e', '#16a34a', '#15803d'],
          });
          
          // Big win (100+ ELO gain)
          if (eloGained >= 100) {
            setTimeout(() => {
              confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.5 },
                colors: ['#fbbf24', '#f59e0b', '#d97706'],
              });
            }, 200);
          }
        }
        
        // Milestone celebration - extra confetti burst
        if (milestone) {
          setTimeout(() => {
            confetti({
              particleCount: 300,
              spread: 180,
              origin: { y: 0.5 },
              colors: ['#f97316', '#ea580c', '#dc2626', '#fbbf24'],
            });
          }, 400);
        }
        
        // Redirect after showing celebration
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
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

  const clearSelections = () => {
    setPlayer1(null);
    setPlayer2(null);
    setTeam1(null);
    setTeam2(null);
    setTeam1Player1(null);
    setTeam1Player2(null);
    setTeam2Player1(null);
    setTeam2Player2(null);
    setPlayer1Score('');
    setPlayer2Score('');
  };

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
      <PageHero
        title="Log a Match"
        description="Record your ping pong match and update the leaderboard"
      />

      {/* Match Result Celebration Overlay */}
      {matchResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center animate-bounce">
            {matchResult.won ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-green-500 mb-2">VICTORY!</h2>
                <div className="text-4xl font-bold text-text-primary mb-2">
                  +{matchResult.eloGained} ELO
                </div>
                {matchResult.streakBonus > 0 && (
                  <div className="text-lg text-orange-500 mb-2">
                    🔥 +{matchResult.streakBonus} Streak Bonus!
                  </div>
                )}
                {matchResult.milestone && (
                  <div className="mt-4 p-4 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <div className="text-2xl mb-1">
                      {matchResult.milestone === 3 && '🔥'}
                      {matchResult.milestone === 7 && '🔥🔥'}
                      {matchResult.milestone === 14 && '🔥🔥🔥'}
                      {matchResult.milestone === 30 && '💥'}
                      {matchResult.milestone === 60 && '⚡'}
                      {matchResult.milestone === 90 && '🌟'}
                      {matchResult.milestone === 180 && '👑'}
                      {matchResult.milestone === 365 && '🏆'}
                    </div>
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {matchResult.milestone}-Day Streak Milestone!
                    </p>
                  </div>
                )}
                <p className="text-text-secondary mt-4">
                  Redirecting to dashboard...
                </p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">👊</div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">Match Logged</h2>
                <div className="text-xl text-text-secondary mb-2">
                  {matchResult.eloGained >= 0 ? '+' : ''}{matchResult.eloGained} ELO
                </div>
                <p className="text-text-secondary mt-4">
                  Better luck next time! Redirecting...
                </p>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Content Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          {/* Match Type Selector */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex h-12 items-center justify-center rounded-lg bg-bg-secondary p-1">
              <button
                onClick={() => { setMatchType('SINGLES'); clearSelections(); }}
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
                onClick={() => { setMatchType('DOUBLES'); clearSelections(); }}
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

          {/* Doubles Mode Selector */}
          {matchType === 'DOUBLES' && (
            <Card className="p-4 mb-6">
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => { setDoublesMode('teams'); clearSelections(); }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    doublesMode === 'teams'
                      ? 'bg-accent text-white'
                      : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  Select Teams
                </button>
                <button
                  onClick={() => { setDoublesMode('adhoc'); clearSelections(); }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    doublesMode === 'adhoc'
                      ? 'bg-accent text-white'
                      : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Shuffle className="h-4 w-4" />
                  Pick Players
                </button>
              </div>
              <p className="text-center text-sm text-text-muted mt-2">
                {doublesMode === 'teams' 
                  ? 'Play with your registered team partners' 
                  : 'Pick any 4 players for a pickup game'}
              </p>
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Enter Score</h2>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-text-secondary">Play to:</label>
                    <select
                      className="h-10 px-3 rounded-lg border border-border bg-bg-primary text-text-primary font-medium"
                      value={maxScore}
                      onChange={(e) => setMaxScore(parseInt(e.target.value))}
                    >
                      <option value={7}>7 points</option>
                      <option value={11}>11 points</option>
                      <option value={15}>15 points</option>
                      <option value={21}>21 points</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <p className="text-sm text-text-secondary mb-2">{player1?.name || 'Player 1'}</p>
                    <Input
                      type="number"
                      min="0"
                      max={maxScore}
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
                      max={maxScore}
                      placeholder="0"
                      value={player2Score}
                      onChange={(e) => setPlayer2Score(e.target.value)}
                      className="text-center text-2xl font-bold h-16"
                    />
                  </div>
                </div>
                <p className="text-center text-sm text-text-muted mt-4">
                  First to {maxScore} points wins (must win by 2)
                </p>
              </Card>
            </div>
          )}

          {/* Doubles Match - Based on Mode */}
          {matchType === 'DOUBLES' && doublesMode === 'teams' && (
            <div className="space-y-6">
              {/* Team 1 Selection */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-text-primary flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  Team 1 (Winner)
                </h2>
                <select
                  className="w-full h-12 px-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:outline-none"
                  value={team1?.id || ''}
                  onChange={(e) => {
                    const t = teams.find(t => t.id === e.target.value);
                    setTeam1(t || null);
                  }}
                >
                  <option value="">Select Team 1</option>
                  {teams.filter(t => t.id !== team2?.id).map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name || `${team.player1.name} & ${team.player2.name}`} ({team.foreverElo} ELO)
                    </option>
                  ))}
                </select>
                {team1 && (
                  <div className="mt-3 flex items-center gap-3 p-3 bg-bg-secondary rounded-lg">
                    <Avatar src={team1.player1.image || undefined} alt={team1.player1.name} fallback={team1.player1.name.charAt(0)} size="sm" />
                    <span className="text-text-muted">&</span>
                    <Avatar src={team1.player2.image || undefined} alt={team1.player2.name} fallback={team1.player2.name.charAt(0)} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{team1.player1.name} & {team1.player2.name}</p>
                      <p className="text-xs text-text-muted">{team1.wins}W - {team1.losses}L</p>
                    </div>
                  </div>
                )}
              </Card>

              {/* VS Divider */}
              <div className="text-center">
                <span className="text-2xl font-bold text-text-muted">VS</span>
              </div>

              {/* Team 2 Selection */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-text-primary">Team 2</h2>
                <select
                  className="w-full h-12 px-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:outline-none"
                  value={team2?.id || ''}
                  onChange={(e) => {
                    const t = teams.find(t => t.id === e.target.value);
                    setTeam2(t || null);
                  }}
                >
                  <option value="">Select Team 2</option>
                  {teams.filter(t => t.id !== team1?.id).map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name || `${team.player1.name} & ${team.player2.name}`} ({team.foreverElo} ELO)
                    </option>
                  ))}
                </select>
                {team2 && (
                  <div className="mt-3 flex items-center gap-3 p-3 bg-bg-secondary rounded-lg">
                    <Avatar src={team2.player1.image || undefined} alt={team2.player1.name} fallback={team2.player1.name.charAt(0)} size="sm" />
                    <span className="text-text-muted">&</span>
                    <Avatar src={team2.player2.image || undefined} alt={team2.player2.name} fallback={team2.player2.name.charAt(0)} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{team2.player1.name} & {team2.player2.name}</p>
                      <p className="text-xs text-text-muted">{team2.wins}W - {team2.losses}L</p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Score Entry */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Enter Score</h2>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-text-secondary">Play to:</label>
                    <select
                      className="h-10 px-3 rounded-lg border border-border bg-bg-primary text-text-primary font-medium"
                      value={maxScore}
                      onChange={(e) => setMaxScore(parseInt(e.target.value))}
                    >
                      <option value={7}>7 points</option>
                      <option value={11}>11 points</option>
                      <option value={15}>15 points</option>
                      <option value={21}>21 points</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <p className="text-sm text-text-secondary mb-2">
                      {team1 ? (team1.name || `${team1.player1.name.split(' ')[0]} & ${team1.player2.name.split(' ')[0]}`) : 'Team 1'}
                    </p>
                    <Input
                      type="number"
                      min="0"
                      max={maxScore}
                      placeholder="0"
                      value={player1Score}
                      onChange={(e) => setPlayer1Score(e.target.value)}
                      className="text-center text-2xl font-bold h-16"
                    />
                  </div>
                  <div className="text-center text-text-muted text-2xl">-</div>
                  <div className="text-center">
                    <p className="text-sm text-text-secondary mb-2">
                      {team2 ? (team2.name || `${team2.player1.name.split(' ')[0]} & ${team2.player2.name.split(' ')[0]}`) : 'Team 2'}
                    </p>
                    <Input
                      type="number"
                      min="0"
                      max={maxScore}
                      placeholder="0"
                      value={player2Score}
                      onChange={(e) => setPlayer2Score(e.target.value)}
                      className="text-center text-2xl font-bold h-16"
                    />
                  </div>
                </div>
                <p className="text-center text-sm text-text-muted mt-4">
                  First to {maxScore} points wins (must win by 2)
                </p>
              </Card>
            </div>
          )}

          {/* Doubles Match - Ad-hoc 4 Players */}
          {matchType === 'DOUBLES' && doublesMode === 'adhoc' && (
            <div className="space-y-6">
              {/* Team 1 (2 players) */}
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
                      <option value="">Select Player</option>
                      {players.filter(p => 
                        p.id !== team1Player2?.id && 
                        p.id !== team2Player1?.id && 
                        p.id !== team2Player2?.id
                      ).map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.doublesForeverElo || player.foreverElo} ELO)
                        </option>
                      ))}
                    </select>
                    {team1Player1 && (
                      <div className="mt-2 flex items-center gap-2">
                        <Avatar src={team1Player1.image || undefined} alt={team1Player1.name} fallback={team1Player1.name.charAt(0)} size="sm" />
                        <span className="text-sm text-text-primary">{team1Player1.name}</span>
                      </div>
                    )}
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
                      <option value="">Select Player</option>
                      {players.filter(p => 
                        p.id !== team1Player1?.id && 
                        p.id !== team2Player1?.id && 
                        p.id !== team2Player2?.id
                      ).map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.doublesForeverElo || player.foreverElo} ELO)
                        </option>
                      ))}
                    </select>
                    {team1Player2 && (
                      <div className="mt-2 flex items-center gap-2">
                        <Avatar src={team1Player2.image || undefined} alt={team1Player2.name} fallback={team1Player2.name.charAt(0)} size="sm" />
                        <span className="text-sm text-text-primary">{team1Player2.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* VS Divider */}
              <div className="text-center">
                <span className="text-2xl font-bold text-text-muted">VS</span>
              </div>

              {/* Team 2 (2 players) */}
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
                      <option value="">Select Player</option>
                      {players.filter(p => 
                        p.id !== team1Player1?.id && 
                        p.id !== team1Player2?.id && 
                        p.id !== team2Player2?.id
                      ).map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.doublesForeverElo || player.foreverElo} ELO)
                        </option>
                      ))}
                    </select>
                    {team2Player1 && (
                      <div className="mt-2 flex items-center gap-2">
                        <Avatar src={team2Player1.image || undefined} alt={team2Player1.name} fallback={team2Player1.name.charAt(0)} size="sm" />
                        <span className="text-sm text-text-primary">{team2Player1.name}</span>
                      </div>
                    )}
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
                      <option value="">Select Player</option>
                      {players.filter(p => 
                        p.id !== team1Player1?.id && 
                        p.id !== team1Player2?.id && 
                        p.id !== team2Player1?.id
                      ).map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.doublesForeverElo || player.foreverElo} ELO)
                        </option>
                      ))}
                    </select>
                    {team2Player2 && (
                      <div className="mt-2 flex items-center gap-2">
                        <Avatar src={team2Player2.image || undefined} alt={team2Player2.name} fallback={team2Player2.name.charAt(0)} size="sm" />
                        <span className="text-sm text-text-primary">{team2Player2.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Score Entry */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Enter Score</h2>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-text-secondary">Play to:</label>
                    <select
                      className="h-10 px-3 rounded-lg border border-border bg-bg-primary text-text-primary font-medium"
                      value={maxScore}
                      onChange={(e) => setMaxScore(parseInt(e.target.value))}
                    >
                      <option value={7}>7 points</option>
                      <option value={11}>11 points</option>
                      <option value={15}>15 points</option>
                      <option value={21}>21 points</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <p className="text-sm text-text-secondary mb-2">
                      {team1Player1 && team1Player2 
                        ? `${team1Player1.name.split(' ')[0]} & ${team1Player2.name.split(' ')[0]}` 
                        : 'Team 1'}
                    </p>
                    <Input
                      type="number"
                      min="0"
                      max={maxScore}
                      placeholder="0"
                      value={player1Score}
                      onChange={(e) => setPlayer1Score(e.target.value)}
                      className="text-center text-2xl font-bold h-16"
                    />
                  </div>
                  <div className="text-center text-text-muted text-2xl">-</div>
                  <div className="text-center">
                    <p className="text-sm text-text-secondary mb-2">
                      {team2Player1 && team2Player2 
                        ? `${team2Player1.name.split(' ')[0]} & ${team2Player2.name.split(' ')[0]}` 
                        : 'Team 2'}
                    </p>
                    <Input
                      type="number"
                      min="0"
                      max={maxScore}
                      placeholder="0"
                      value={player2Score}
                      onChange={(e) => setPlayer2Score(e.target.value)}
                      className="text-center text-2xl font-bold h-16"
                    />
                  </div>
                </div>
                <p className="text-center text-sm text-text-muted mt-4">
                  First to {maxScore} points wins (must win by 2)
                </p>
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
