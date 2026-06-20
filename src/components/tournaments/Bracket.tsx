'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Trophy, Crown } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  image?: string | null;
}

interface BracketSlot {
  id: string;
  round: number;
  position: number;
  player1Id?: string;
  player2Id?: string;
  player1?: Player;
  player2?: Player;
  winnerId?: string;
  matchId?: string;
  bracketType?: string;
  isBye?: boolean;
}

interface BracketProps {
  brackets: BracketSlot[];
  format: string;
  players: { userId: string; user: Player }[];
  onMatchClick?: (bracket: BracketSlot) => void;
  isAdmin?: boolean;
}

const formatLabels: Record<string, string> = {
  SINGLE_ELIMINATION: 'Single Elimination',
  DOUBLE_ELIMINATION: 'Double Elimination',
  ROUND_ROBIN: 'Round Robin',
  SWISS: 'Swiss System',
};

const roundLabels: Record<string, (round: number, total: number) => string> = {
  SINGLE_ELIMINATION: (round: number, total: number) => {
    if (round === total) return 'Finals';
    if (round === total - 1) return 'Semi-Finals';
    if (round === total - 2) return 'Quarter-Finals';
    return `Round ${round}`;
  },
  DOUBLE_ELIMINATION: (round: number, total: number) => {
    if (round === total) return 'Grand Finals';
    if (round === total - 1) return 'Winners Finals';
    if (round < total / 2) return `Winners R${round}`;
    if (round === total / 2) return 'Losers Finals';
    return `Losers R${round - total / 2}`;
  },
  ROUND_ROBIN: () => 'Matches',
  SWISS: (round: number) => `Round ${round}`,
};

export function TournamentBracket({ brackets, format, players, onMatchClick, isAdmin }: BracketProps) {
  if (!brackets || brackets.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Bracket will appear here once the tournament starts</p>
      </div>
    );
  }

  // Get player name by ID
  const getPlayer = (playerId?: string) => {
    if (!playerId) return null;
    const participant = players.find(p => p.userId === playerId);
    return participant?.user;
  };

  // Group brackets by round
  const rounds = [...new Set(brackets.map(b => b.round))].sort((a, b) => a - b);
  const maxRound = Math.max(...rounds);

  // For Round Robin - show as a list
  if (format === 'ROUND_ROBIN') {
    const completed = brackets.filter(b => b.matchId);
    const pending = brackets.filter(b => !b.matchId);
    
    return (
      <div className="space-y-6">
        {completed.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Completed Matches
            </h3>
            <div className="grid gap-3">
              {completed.map((bracket) => {
                const p1 = getPlayer(bracket.player1Id);
                const p2 = getPlayer(bracket.player2Id);
                return (
                  <Card 
                    key={bracket.id} 
                    className="p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className={bracket.winnerId === bracket.player1Id ? 'font-bold text-green-600' : 'text-text-muted'}>
                          {p1?.name || 'Unknown'}
                        </span>
                        <Badge>vs</Badge>
                        <span className={bracket.winnerId === bracket.player2Id ? 'font-bold text-green-600' : 'text-text-muted'}>
                          {p2?.name || 'Unknown'}
                        </span>
                      </div>
                      <Badge variant="success">Complete</Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
        
        {pending.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Upcoming Matches
            </h3>
            <div className="grid gap-3">
              {pending.map((bracket) => {
                const p1 = getPlayer(bracket.player1Id);
                const p2 = getPlayer(bracket.player2Id);
                return (
                  <Card 
                    key={bracket.id} 
                    className={`p-4 ${isAdmin ? 'cursor-pointer hover:bg-bg-secondary transition-colors' : ''}`}
                    onClick={() => isAdmin && onMatchClick?.(bracket)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-text-muted">{p1?.name || 'TBD'}</span>
                        <Badge variant="outline">vs</Badge>
                        <span className="text-text-muted">{p2?.name || 'TBD'}</span>
                      </div>
                      {isAdmin && (
                        <Badge variant="outline">Log Result</Badge>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // For elimination formats - show bracket tree
  const winnerBrackets = brackets.filter(b => !b.bracketType || b.bracketType === 'winner');
  const loserBrackets = brackets.filter(b => b.bracketType === 'loser');
  const grandFinals = brackets.filter(b => b.bracketType === 'grand_final');

  // Get round label
  const getRoundLabel = (round: number) => {
    const labels = roundLabels[format] || ((r: number) => `Round ${r}`);
    return labels(round, maxRound);
  };

  return (
    <div className="space-y-6">
      {/* Winner Bracket */}
      {winnerBrackets.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            {format === 'DOUBLE_ELIMINATION' ? 'Winners Bracket' : formatLabels[format] || 'Bracket'}
          </h3>
          <div className="flex gap-8 overflow-x-auto pb-4">
            {rounds.filter(r => winnerBrackets.some(b => b.round === r)).map((round) => {
              const roundBrackets = winnerBrackets
                .filter(b => b.round === round)
                .sort((a, b) => a.position - b.position);
              
              return (
                <div key={round} className="flex flex-col">
                  <h4 className="text-center text-sm font-medium text-text-secondary mb-4 sticky top-0 bg-bg-primary">
                    {getRoundLabel(round)}
                  </h4>
                  <div className="flex flex-col gap-4" style={{ justifyContent: 'space-around', flexGrow: 1 }}>
                    {roundBrackets.map((bracket) => {
                      const p1 = getPlayer(bracket.player1Id);
                      const p2 = getPlayer(bracket.player2Id);
                      const isMatch = bracket.player1Id && bracket.player2Id;
                      
                      return (
                        <Card 
                          key={bracket.id}
                          className={`w-56 p-3 ${isMatch && isAdmin ? 'cursor-pointer hover:bg-bg-secondary transition-colors' : ''} ${bracket.isBye ? 'opacity-60' : ''} ${bracket.matchId ? 'border-green-500/50' : ''}`}
                          onClick={() => isMatch && !bracket.matchId && onMatchClick?.(bracket)}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={`text-sm truncate ${bracket.winnerId === bracket.player1Id ? 'font-bold text-green-600' : ''}`}>
                                {p1?.name || (bracket.isBye ? 'BYE' : 'TBD')}
                              </span>
                              {bracket.matchId && bracket.winnerId === bracket.player1Id && (
                                <Badge variant="success" className="text-xs">W</Badge>
                              )}
                            </div>
                            <div className="border-t border-border pt-2">
                              <div className="flex items-center justify-between">
                                <span className={`text-sm truncate ${bracket.winnerId === bracket.player2Id ? 'font-bold text-green-600' : ''}`}>
                                  {p2?.name || 'TBD'}
                                </span>
                                {bracket.matchId && bracket.winnerId === bracket.player2Id && (
                                  <Badge variant="success" className="text-xs">W</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loser Bracket (Double Elim) */}
      {loserBrackets.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-red-500" />
            Losers Bracket
          </h3>
          <div className="flex gap-8 overflow-x-auto pb-4">
            {[...new Set(loserBrackets.map(b => b.round))].sort((a, b) => a - b).map((round) => {
              const roundBrackets = loserBrackets
                .filter(b => b.round === round)
                .sort((a, b) => a.position - b.position);
              
              return (
                <div key={round} className="flex flex-col">
                  <h4 className="text-center text-sm font-medium text-text-secondary mb-4">
                    Losers R{round}
                  </h4>
                  <div className="flex flex-col gap-4">
                    {roundBrackets.map((bracket) => {
                      const p1 = getPlayer(bracket.player1Id);
                      const p2 = getPlayer(bracket.player2Id);
                      const isMatch = bracket.player1Id && bracket.player2Id;
                      
                      return (
                        <Card 
                          key={bracket.id}
                          className={`w-48 p-3 ${isMatch && isAdmin ? 'cursor-pointer hover:bg-bg-secondary transition-colors' : ''}`}
                          onClick={() => isMatch && !bracket.matchId && onMatchClick?.(bracket)}
                        >
                          <div className="text-xs text-text-muted mb-1">Losers R{round - maxRound}</div>
                          <div className="flex items-center justify-between text-sm">
                            <span className={bracket.winnerId === bracket.player1Id ? 'font-bold text-green-600' : ''}>
                              {p1?.name || 'TBD'}
                            </span>
                            <span className="text-text-muted">vs</span>
                            <span className={bracket.winnerId === bracket.player2Id ? 'font-bold text-green-600' : ''}>
                              {p2?.name || 'TBD'}
                            </span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grand Finals (Double Elim) */}
      {grandFinals.length > 0 && (
        <div className="flex justify-center">
          <Card className="p-6 border-2 border-yellow-500/50 bg-yellow-500/5">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center justify-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Grand Finals
            </h3>
            {grandFinals.map((bracket) => {
              const p1 = getPlayer(bracket.player1Id);
              const p2 = getPlayer(bracket.player2Id);
              const isMatch = bracket.player1Id && bracket.player2Id;
              
              return (
                <div 
                  key={bracket.id}
                  className={`p-4 rounded-lg bg-bg-secondary ${isMatch && isAdmin ? 'cursor-pointer hover:bg-bg-secondary/80' : ''}`}
                  onClick={() => isMatch && !bracket.matchId && onMatchClick?.(bracket)}
                >
                  <div className="flex items-center gap-8 text-lg">
                    <span className={bracket.winnerId === bracket.player1Id ? 'font-bold text-green-600' : ''}>
                      {p1?.name || 'TBD'}
                    </span>
                    <span className="text-text-muted">vs</span>
                    <span className={bracket.winnerId === bracket.player2Id ? 'font-bold text-green-600' : ''}>
                      {p2?.name || 'TBD'}
                    </span>
                  </div>
                  {bracket.matchId && (
                    <div className="text-center mt-2">
                      <Badge variant="success" className="text-sm">
                        {bracket.winnerId === p1?.id ? p1?.name : p2?.name} Wins!
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* Champion */}
      {brackets.some(b => b.matchId) && format !== 'DOUBLE_ELIMINATION' && (
        <div className="flex justify-center">
          <Card className="p-6 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500">
            <div className="text-center">
              <Trophy className="h-12 w-12 mx-auto mb-2 text-yellow-500" />
              <h3 className="text-xl font-bold text-text-primary">Champion</h3>
              <p className="text-2xl font-bold text-yellow-500 mt-2">
                {(() => {
                  const finalBracket = brackets.find(b => b.round === maxRound && b.matchId);
                  if (!finalBracket) return 'TBD';
                  return finalBracket.winnerId === finalBracket.player1Id 
                    ? getPlayer(finalBracket.player1Id)?.name 
                    : getPlayer(finalBracket.player2Id)?.name;
                })()}
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
