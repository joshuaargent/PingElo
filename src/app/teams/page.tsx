'use client';

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { PageHero } from "@/components/layout/PageHero";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Users, Plus, Trash2, Calendar, Trophy, Target, Flame, Clock, History, Sparkles, Crown, Zap, Star } from "lucide-react";

interface Team {
  id: string;
  name: string | null;
  foreverElo: number;
  seasonElo: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  isActive: boolean;
  player1: { id: string; name: string; image: string | null; doublesForeverElo: number };
  player2: { id: string; name: string; image: string | null; doublesForeverElo: number };
  season: { id: string; name: string; isActive: boolean };
}

interface TeamLimits {
  maxTeamsYouCanBeIn: number;
  maxTeamsYouCanCreate: number;
  teamsCreatedByYou: number;
  teamsYouAreIn: number;
}

interface TeamStats {
  totalTeams: number;
  totalWins: number;
  totalLosses: number;
  totalMatches: number;
  overallWinRate: number;
  bestWinRate: number;
  seasonsParticipated: number;
}

interface CurrentSeason {
  id: string;
  name: string;
}

interface Player {
  id: string;
  name: string;
  image: string | null;
  doublesForeverElo: number;
}

export default function TeamsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentTeams, setCurrentTeams] = useState<Team[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [limits, setLimits] = useState<TeamLimits | null>(null);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [currentSeason, setCurrentSeason] = useState<CurrentSeason | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState("");
  const [teamName, setTeamName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Fire celebration confetti
  const fireConfetti = useCallback(() => {
    const duration = 2500;
    const end = Date.now() + duration;
    const colors = ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1', '#9B59B6'];
    
    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
    
    // Center burst
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: colors,
      startVelocity: 40,
    });
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) redirect("/auth/signin");
    fetchData();
  }, [session, status, showHistory]);

  async function fetchData() {
    setIsLoading(true);
    try {
      // Always fetch both current season teams and all history
      const [currentRes, historyRes, playersRes] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/teams?history=true"),
        fetch("/api/users?includeStats=true"),
      ]);
      
      if (currentRes.ok) {
        const currentData = await currentRes.json();
        setCurrentTeams(currentData.teams || []);
        setCurrentSeason(currentData.currentSeason);
        setLimits(currentData.limits);
        setStats(currentData.stats);
      }
      
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setAllTeams(historyData.teams || []);
      }
      
      if (playersRes.ok) {
        setAllPlayers((await playersRes.json()).users || []);
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function createTeam() {
    if (!selectedPartner) return;
    setIsCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: selectedPartner, name: teamName || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setSelectedPartner("");
        setTeamName("");
        setShowConfetti(true);
        fetchData();
      } else {
        setCreateError(data.error || "Failed to create team");
      }
    } catch { 
      setCreateError("Failed to create team"); 
    }
    finally { setIsCreating(false); }
  }

  // Fire confetti when team is created
  useEffect(() => {
    if (showConfetti) {
      setTimeout(() => {
        fireConfetti();
        setShowConfetti(false);
      }, 300);
    }
  }, [showConfetti, fireConfetti]);

  async function deleteTeam(teamId: string) {
    if (!confirm("Delete this team? This cannot be undone.")) return;
    const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
    if (res.ok) {
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete team");
    }
  }

  async function reactivateTeam(teamId: string) {
    const res = await fetch(`/api/teams/${teamId}`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      alert(data.message || "Team reactivated!");
      setShowConfetti(true);
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to reactivate team");
    }
  }

  const teams = showHistory ? allTeams : currentTeams;
  const canCreateTeam = limits && limits.teamsCreatedByYou < limits.maxTeamsYouCanCreate;
  const canBeInMoreTeams = limits && limits.teamsYouAreIn < limits.maxTeamsYouCanBeIn;
  
  // Filter out players who are already your teammate this season
  const available = allPlayers.filter(p => {
    if (p.id === session?.user?.id) return false;
    if (currentTeams.some(t => t.player1.id === p.id || t.player2.id === p.id)) return false;
    return true;
  });

  // Group teams by season for history view
  const teamsBySeason = teams.reduce((acc, team) => {
    const seasonName = team.season.name;
    if (!acc[seasonName]) acc[seasonName] = [];
    acc[seasonName].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  if (status === "loading" || isLoading) {
    return <div className="flex justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"/></div>;
  }

  return (
    <>
      <PageHero 
        title="My Teams" 
        description={showHistory ? "Your complete doubles partnership history across all seasons" : "Your current season partnerships"} 
      />
      <div className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          
          {/* Stats Overview */}
          {stats && stats.totalTeams > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <Card className="p-3 text-center">
                <Trophy className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                <p className="text-xl font-bold text-text-primary">{stats.totalWins}</p>
                <p className="text-xs text-text-secondary">Total Wins</p>
              </Card>
              <Card className="p-3 text-center">
                <Target className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <p className="text-xl font-bold text-text-primary">{stats.overallWinRate}%</p>
                <p className="text-xs text-text-secondary">Win Rate</p>
              </Card>
              <Card className="p-3 text-center">
                <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                <p className="text-xl font-bold text-text-primary">{stats.bestWinRate}%</p>
                <p className="text-xs text-text-secondary">Best Win Rate</p>
              </Card>
              <Card className="p-3 text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                <p className="text-xl font-bold text-text-primary">{stats.seasonsParticipated}</p>
                <p className="text-xs text-text-secondary">Seasons</p>
              </Card>
              <Card className="p-3 text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-accent" />
                <p className="text-xl font-bold text-text-primary">{stats.totalTeams}</p>
                <p className="text-xs text-text-secondary">Total Teams</p>
              </Card>
            </div>
          )}
          
          {/* Action Bar */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="flex gap-2">
              <Button 
                variant={!showHistory ? "primary" : "outline"} 
                size="sm"
                onClick={() => setShowHistory(false)}
              >
                <Sparkles className="h-4 w-4 mr-1"/>Current Season
              </Button>
              <Button 
                variant={showHistory ? "primary" : "outline"} 
                size="sm"
                onClick={() => setShowHistory(true)}
              >
                <History className="h-4 w-4 mr-1"/>All History
              </Button>
            </div>
            
            {!showHistory && canCreateTeam && canBeInMoreTeams && (
              <Button onClick={() => setShowModal(true)} className="animate-pulse-subtle">
                <Plus className="h-4 w-4 mr-2"/>Create Team
              </Button>
            )}
            
            {showHistory && stats && (
              <Badge variant="outline">
                <Calendar className="h-3 w-3 mr-1"/>{stats.seasonsParticipated} season{stats.seasonsParticipated !== 1 ? 's' : ''} of history
              </Badge>
            )}
          </div>

          {/* Empty States */}
          {!showHistory && currentTeams.length === 0 && (
            <Card className="p-12 text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="h-10 w-10 text-accent"/>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Ready to Team Up?
              </h3>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                Doubles matches are more fun with a partner! Create your first team and start competing together.
              </p>
              {canCreateTeam && canBeInMoreTeams ? (
                <Button onClick={() => setShowModal(true)} size="lg">
                  <Plus className="h-4 w-4 mr-2"/>Create Your First Team
                </Button>
              ) : (
                <p className="text-text-muted">You&apos;ve reached your team limit for this season</p>
              )}
            </Card>
          )}

          {/* Current Season Teams */}
          {!showHistory && currentTeams.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-5 w-5 text-yellow-500"/>
                <h2 className="text-lg font-semibold text-text-primary">
                  {currentSeason?.name || 'Current Season'} Teams
                </h2>
                <Badge variant="accent" size="sm">{currentTeams.length}/{limits?.maxTeamsYouCanBeIn}</Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {currentTeams.map(team => (
                  <TeamCard 
                    key={team.id} 
                    team={team} 
                    session={session}
                    isCurrentSeason={true}
                    onDelete={deleteTeam}
                    onReactivate={reactivateTeam}
                  />
                ))}
              </div>
            </div>
          )}

          {/* History View - Grouped by Season */}
          {showHistory && allTeams.length > 0 && (
            <div className="space-y-8">
              {Object.entries(teamsBySeason).map(([seasonName, seasonTeams]) => {
                const isCurrent = seasonTeams.some(t => t.season.isActive);
                return (
                  <div key={seasonName}>
                    <div className="flex items-center gap-2 mb-4">
                      {isCurrent ? (
                        <><Crown className="h-5 w-5 text-yellow-500"/><h2 className="text-lg font-semibold text-text-primary">{seasonName} (Current)</h2></>
                      ) : (
                        <><History className="h-5 w-5 text-text-muted"/><h2 className="text-lg font-semibold text-text-secondary">{seasonName}</h2></>
                      )}
                      <Badge variant={isCurrent ? "accent" : "outline"} size="sm">
                        {seasonTeams.length} team{seasonTeams.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {seasonTeams.map(team => (
                        <TeamCard 
                          key={team.id} 
                          team={team} 
                          session={session}
                          isCurrentSeason={isCurrent}
                          onDelete={deleteTeam}
                          onReactivate={reactivateTeam}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* History Empty State */}
          {showHistory && allTeams.length === 0 && (
            <Card className="p-12 text-center">
              <Star className="h-16 w-16 mx-auto text-text-muted mb-4"/>
              <h3 className="text-lg font-semibold text-text-primary mb-2">No Team History Yet</h3>
              <p className="text-text-secondary mb-6">
                Start playing to build your doubles partnership history!
              </p>
              <Button onClick={() => setShowHistory(false)}>
                Go to Current Season
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="h-6 w-6 text-accent"/>
              </div>
              <h2 className="text-xl font-bold">Create a Team</h2>
            </div>
            <p className="text-sm text-text-secondary mb-4 text-center">
              You can create {limits?.maxTeamsYouCanCreate} team(s) per season and be in up to {limits?.maxTeamsYouCanBeIn} teams total.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Team Name (Optional)</label>
                <input 
                  type="text" 
                  placeholder="The Dynamic Duo" 
                  value={teamName} 
                  onChange={e => setTeamName(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Select Partner *</label>
                <select 
                  value={selectedPartner} 
                  onChange={e => { setSelectedPartner(e.target.value); setCreateError(""); }}
                  className="w-full h-12 px-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent"
                >
                  <option value="">Choose a partner...</option>
                  {available.length === 0 ? (
                    <option value="" disabled>No available players</option>
                  ) : (
                    available.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.doublesForeverElo} ELO)
                      </option>
                    ))
                  )}
                </select>
              </div>
              {createError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                  {createError}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => { setShowModal(false); setSelectedPartner(""); setTeamName(""); setCreateError(""); }} className="flex-1">Cancel</Button>
              <Button onClick={createTeam} isLoading={isCreating} disabled={!selectedPartner} className="flex-1">
                <Zap className="h-4 w-4 mr-1"/>Create Team
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

// Team Card Component
function TeamCard({ 
  team, 
  session, 
  isCurrentSeason, 
  onDelete, 
  onReactivate 
}: { 
  team: Team; 
  session: any; 
  isCurrentSeason: boolean; 
  onDelete: (id: string) => void; 
  onReactivate: (id: string) => void;
}) {
  const w = team.wins || 0, l = team.losses || 0, total = w + l;
  const isCreator = team.player1.id === session?.user?.id;
  const isYou = team.player1.id === session?.user?.id || team.player2.id === session?.user?.id;
  const winRate = total > 0 ? Math.round((w / total) * 100) : 0;
  
  return (
    <Card className={`p-5 hover:shadow-lg transition-shadow ${!team.isActive ? 'opacity-75' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-text-primary">
              {team.name || `${team.player1.name.split(" ")[0]} & ${team.player2.name.split(" ")[0]}`}
            </h3>
            {!team.isActive && (
              <Badge variant="outline" size="sm">Inactive</Badge>
            )}
            {isCreator && (
              <Badge variant="accent" size="sm">Creator</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={team.foreverElo >= 1000 ? "default" : "danger"}>
              {team.foreverElo} ELO
            </Badge>
            {team.seasonElo !== team.foreverElo && (
              <Badge variant="outline">{team.seasonElo} Season</Badge>
            )}
          </div>
        </div>
        {isCurrentSeason && isCreator && (
          <Button variant="ghost" size="sm" onClick={() => onDelete(team.id)} className="text-red-500 hover:text-red-400">
            <Trash2 className="h-4 w-4"/>
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-2 mb-3 text-sm text-text-secondary">
        <Calendar className="h-3 w-3" />
        {team.season.name}
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <Avatar src={team.player1.image || undefined} alt={team.player1.name} fallback={team.player1.name.charAt(0)} size="sm"/>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {team.player1.name}
              {team.player1.id === session?.user?.id && <span className="text-accent ml-1">(You)</span>}
            </p>
          </div>
        </div>
        <span className="text-text-muted">&</span>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="min-w-0 text-right">
            <p className="text-sm font-medium truncate">
              {team.player2.id === session?.user?.id && <span className="text-accent mr-1">(You)</span>}
              {team.player2.name}
            </p>
          </div>
          <Avatar src={team.player2.image || undefined} alt={team.player2.name} fallback={team.player2.name.charAt(0)} size="sm"/>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
        <div className="text-center">
          <p className="text-lg font-bold text-green-500">{w}</p>
          <p className="text-xs text-text-muted">Wins</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-red-500">{l}</p>
          <p className="text-xs text-text-muted">Losses</p>
        </div>
        <div className="text-center">
          <p className={`text-lg font-bold ${winRate >= 60 ? 'text-accent' : 'text-text-primary'}`}>
            {winRate}%
          </p>
          <p className="text-xs text-text-muted">Win Rate</p>
        </div>
      </div>
      
      {/* Reactivate Button */}
      {!team.isActive && isCurrentSeason && isYou && (
        <div className="mt-4 pt-3 border-t border-border">
          <Button 
            onClick={() => onReactivate(team.id)} 
            size="sm" 
            className="w-full"
            variant="accent"
          >
            <Sparkles className="h-4 w-4 mr-1"/>Reconnect Partnership
          </Button>
        </div>
      )}
    </Card>
  );
}
