'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Users, Plus, Trash2, Info, Calendar, Trophy, Target, Flame, Clock, History } from "lucide-react";

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
  const [teams, setTeams] = useState<Team[]>([]);
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

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) redirect("/auth/signin");
    fetchData();
  }, [session, status, showHistory]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [teamsRes, playersRes] = await Promise.all([
        fetch(showHistory ? "/api/teams?history=true" : "/api/teams"),
        fetch("/api/users?includeStats=true"),
      ]);
      if (teamsRes.ok) {
        const data = await teamsRes.json();
        setTeams(data.teams || []);
        setLimits(data.limits);
        setStats(data.stats);
        setCurrentSeason(data.currentSeason);
      }
      if (playersRes.ok) setAllPlayers((await playersRes.json()).users || []);
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
        setShowHistory(false);
        fetchData();
      } else {
        setCreateError(data.error || "Failed to create team");
      }
    } catch { 
      setCreateError("Failed to create team"); 
    }
    finally { setIsCreating(false); }
  }

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

  const canCreateTeam = limits && limits.teamsCreatedByYou < limits.maxTeamsYouCanCreate;
  const canBeInMoreTeams = limits && limits.teamsYouAreIn < limits.maxTeamsYouCanBeIn;
  const hasActiveSeason = currentSeason !== null;
  
  // Filter out players who are already your teammate OR who are already in 2 teams
  const available = allPlayers.filter(p => {
    if (p.id === session?.user?.id) return false;
    // Can't team with someone already on your team this season
    if (teams.some(t => t.player1.id === p.id || t.player2.id === p.id)) return false;
    return true;
  });

  if (status === "loading" || isLoading) {
    return <div className="flex justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"/></div>;
  }

  // No active season
  if (!hasActiveSeason) {
    return (
      <>
        <PageHero title="My Teams" description="Your doubles partnership history" />
        <div className="container mx-auto px-4 pb-16">
          <div className="mx-auto max-w-4xl">
            <Card className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto text-text-muted mb-4"/>
              <h3 className="text-lg font-semibold text-text-primary mb-2">No Active Season</h3>
              <p className="text-text-secondary mb-6">
                Teams are seasonal. You&apos;ll be able to create teams when a new season starts!
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => setShowHistory(true)}>
                  <History className="h-4 w-4 mr-2"/>View Past Teams
                </Button>
                <Button onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero title="My Teams" description={showHistory ? "All your past and present teams" : "Manage your doubles partnerships for this season"} />
      <div className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          
          {/* Stats Overview */}
          {stats && stats.totalTeams > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4 text-center">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold text-text-primary">{stats.totalWins}</p>
                <p className="text-xs text-text-secondary">Total Wins</p>
              </Card>
              <Card className="p-4 text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-text-primary">{stats.overallWinRate}%</p>
                <p className="text-xs text-text-secondary">Win Rate</p>
              </Card>
              <Card className="p-4 text-center">
                <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold text-text-primary">{stats.bestWinRate}%</p>
                <p className="text-xs text-text-secondary">Best Win Rate</p>
              </Card>
              <Card className="p-4 text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold text-text-primary">{stats.seasonsParticipated}</p>
                <p className="text-xs text-text-secondary">Seasons</p>
              </Card>
            </div>
          )}

          {/* Season & Limits Info */}
          {limits && (
            <div className="mb-6 p-4 bg-bg-secondary rounded-lg border border-border">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent" />
                  <span className="text-sm text-text-secondary">Current Season:</span>
                  <Badge variant="accent">{currentSeason?.name}</Badge>
                  {showHistory && <Badge variant="outline">Viewing All History</Badge>}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-text-muted" />
                    <span className="text-text-secondary">Teams you created:</span>
                    <span className="font-semibold">{limits.teamsCreatedByYou}/{limits.maxTeamsYouCanCreate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-text-muted" />
                    <span className="text-text-secondary">Teams you're in:</span>
                    <span className="font-semibold">{limits.teamsYouAreIn}/{limits.maxTeamsYouCanBeIn}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toggle & Create Team */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-2">
              <Button 
                variant={showHistory ? "outline" : "default"} 
                size="sm"
                onClick={() => setShowHistory(false)}
              >
                Current Season
              </Button>
              <Button 
                variant={showHistory ? "default" : "outline"} 
                size="sm"
                onClick={() => setShowHistory(true)}
              >
                <History className="h-4 w-4 mr-1"/>All History
              </Button>
            </div>
            {!showHistory && (
              <Button 
                onClick={() => setShowModal(true)} 
                disabled={!canCreateTeam || !canBeInMoreTeams}
              >
                <Plus className="h-4 w-4 mr-2"/>
                {canCreateTeam ? "Create Team" : "Max Teams Created"}
              </Button>
            )}
          </div>

          {teams.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto text-text-muted mb-4"/>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {showHistory ? "No Team History" : "No Teams This Season"}
              </h3>
              <p className="text-text-secondary mb-6">
                {showHistory 
                  ? "You haven't been on any teams yet."
                  : canCreateTeam 
                    ? "Create a team with another player to compete in doubles tournaments"
                    : "You've reached the limit of teams you can create this season"}
              </p>
              {!showHistory && canCreateTeam && (
                <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-2"/>Create Team</Button>
              )}
              {showHistory && (
                <Button variant="outline" onClick={() => setShowHistory(false)}>
                  Create Your First Team
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {teams.map(team => {
                const w = team.wins || 0, l = team.losses || 0, total = w + l;
                const isCreator = team.player1.id === session?.user?.id;
                const isCurrentSeason = team.season.isActive;
                return (
                  <Card key={team.id} className={`p-6 hover:shadow-lg ${!team.isActive ? 'opacity-75' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-text-primary text-lg">
                            {team.name || team.player1.name.split(" ")[0] + " & " + team.player2.name.split(" ")[0]}
                          </h3>
                          {!team.isActive && (
                            <Badge variant="outline" size="sm">Past Season</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge>{team.foreverElo} ELO</Badge>
                          {team.seasonElo !== team.foreverElo && (
                            <Badge variant="accent">{team.seasonElo} Season</Badge>
                          )}
                        </div>
                      </div>
                      {isCurrentSeason && isCreator && (
                        <Button variant="ghost" size="sm" onClick={() => deleteTeam(team.id)} className="text-red-500">
                          <Trash2 className="h-4 w-4"/>
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3 text-sm text-text-secondary">
                      <Calendar className="h-4 w-4" />
                      {team.season.name}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Avatar src={team.player1.image || undefined} alt={team.player1.name} fallback={team.player1.name.charAt(0)} size="sm"/>
                        <div>
                          <p className="text-sm font-medium">
                            {team.player1.name}
                            {team.player1.id === session?.user?.id && <span className="text-accent ml-1">(You)</span>}
                            {isCreator && <Badge variant="accent" className="ml-2 text-xs">Creator</Badge>}
                          </p>
                          <p className="text-xs text-text-muted">{team.player1.doublesForeverElo} ELO</p>
                        </div>
                      </div>
                      <span className="text-text-muted">&</span>
                      <div className="flex items-center gap-2">
                        <Avatar src={team.player2.image || undefined} alt={team.player2.name} fallback={team.player2.name.charAt(0)} size="sm"/>
                        <div>
                          <p className="text-sm font-medium">
                            {team.player2.name}
                            {team.player2.id === session?.user?.id && <span className="text-accent ml-1">(You)</span>}
                          </p>
                          <p className="text-xs text-text-muted">{team.player2.doublesForeverElo} ELO</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                      <div className="text-center"><p className="text-xl font-bold">{w}</p><p className="text-xs text-text-muted">Wins</p></div>
                      <div className="text-center"><p className="text-xl font-bold">{l}</p><p className="text-xs text-text-muted">Losses</p></div>
                      <div className="text-center"><p className="text-xl font-bold text-accent">{total > 0 ? Math.round((w/total)*100) : 0}%</p><p className="text-xs text-text-muted">Win Rate</p></div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-2">Create a Team</h2>
            <p className="text-sm text-text-secondary mb-4">
              You can create {limits?.maxTeamsYouCanCreate} team(s) per season and be in up to {limits?.maxTeamsYouCanBeIn} teams.
              {limits && limits.teamsCreatedByYou > 0 && (
                <span className="block mt-1">You've created {limits.teamsCreatedByYou} team(s) this season.</span>
              )}
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
              <Button onClick={createTeam} isLoading={isCreating} disabled={!selectedPartner} className="flex-1">Create Team</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}