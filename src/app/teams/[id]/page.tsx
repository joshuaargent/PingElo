'use client';

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter, useParams } from "next/navigation";
import confetti from "canvas-confetti";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Calendar, Sparkles, Users, Crown, Edit2, Save, X, Image as ImageIcon, BarChart3, Swords } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SeasonStat {
  id: string;
  seasonElo: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  season: { id: string; name: string; isActive: boolean; startDate: string };
}

interface Team {
  id: string;
  name: string | null;
  image: string | null;
  foreverElo: number;
  isActive: boolean;
  totalWins: number;
  totalLosses: number;
  totalMatchesPlayed: number;
  player1: { id: string; name: string; image: string | null; doublesForeverElo: number };
  player2: { id: string; name: string; image: string | null; doublesForeverElo: number };
  seasonStats: SeasonStat[];
}

export default function TeamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [eloHistory, setEloHistory] = useState<any[]>([]);
  const [eloStats, setEloStats] = useState<any>(null);
  const [eloTimeframe, setEloTimeframe] = useState<'week' | 'month' | 'season' | 'all'>('month');
  const [headToHeadOpen, setHeadToHeadOpen] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null);
  const [headToHeadData, setHeadToHeadData] = useState<any>(null);
  const [recentOpponents, setRecentOpponents] = useState<any[]>([]);

  const teamId = params.id as string;

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
    fetchTeamData();
  }, [session, status, teamId]);

  async function fetchTeamData() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load team");
        return;
      }
      const data = await res.json();
      setTeam(data.team);
      setEditName(data.team.name || "");
      setEditImage(data.team.image || "");
    } catch (error) {
      console.error("Failed to fetch team:", error);
      setError("Failed to load team");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchEloHistory() {
    try {
      const res = await fetch(`/api/teams/${teamId}/elo-history?timeframe=${eloTimeframe}`);
      if (res.ok) {
        const data = await res.json();
        setEloHistory(data.history || []);
        setEloStats(data.stats || null);
      }
    } catch (error) {
      console.error("Failed to fetch ELO history:", error);
    }
  }

  // Fetch ELO history after team loads
  useEffect(() => {
    if (teamId && !isLoading) {
      fetchEloHistory();
    }
  }, [teamId, isLoading, eloTimeframe]);

  // Fetch head-to-head when modal opens
  useEffect(() => {
    if (headToHeadOpen && selectedOpponent && teamId) {
      async function fetchHeadToHead() {
        try {
          const res = await fetch(`/api/teams/${teamId}/head-to-head?opponentId=${selectedOpponent.id}`);
          if (res.ok) {
            const data = await res.json();
            setHeadToHeadData(data);
          }
        } catch (error) {
          console.error("Failed to fetch head-to-head:", error);
        }
      }
      fetchHeadToHead();
    }
  }, [headToHeadOpen, selectedOpponent, teamId]);

  async function saveTeamEdits() {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, image: editImage }),
      });
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
        setIsEditing(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update team");
      }
    } catch (error) {
      alert("Failed to update team");
    } finally {
      setIsSaving(false);
    }
  }

  async function reactivateTeam() {
    const res = await fetch(`/api/teams/${teamId}`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      alert(data.message || "Team reactivated!");
      setShowConfetti(true);
      fetchTeamData();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to reactivate team");
    }
  }

  async function deactivateTeam() {
    if (!confirm("Deactivate this team? It will be saved in history.")) return;
    const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/teams");
    } else {
      const data = await res.json();
      alert(data.error || "Failed to deactivate team");
    }
  }

  async function leaveTeam() {
    if (!confirm("Leave this team? Your spot will be given to someone else.")) return;
    const res = await fetch(`/api/teams/${teamId}/leave`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      alert(data.message || "You left the team!");
      router.push("/teams");
    } else {
      const data = await res.json();
      alert(data.error || "Failed to leave team");
    }
  }

  useEffect(() => {
    if (showConfetti) {
      setTimeout(() => {
        fireConfetti();
        setShowConfetti(false);
      }, 300);
    }
  }, [showConfetti, fireConfetti]);

  if (status === "loading" || isLoading) {
    return <div className="flex justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"/></div>;
  }

  if (error || !team) {
    return (
      <>
        <PageHero title="Team Not Found" description="This team doesn't exist or you don't have access" />
        <div className="container mx-auto px-4 pb-16">
          <div className="mx-auto max-w-4xl">
            <Card className="p-6 sm:p-12 text-center">
              <Users className="h-16 w-16 mx-auto text-text-muted mb-4"/>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{error || "Team not found"}</h3>
              <Link href="/teams">
                <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2"/>Back to Teams</Button>
              </Link>
            </Card>
          </div>
        </div>
      </>
    );
  }

  const isMember = team.player1.id === session?.user?.id || team.player2.id === session?.user?.id;
  const isCreator = team.player1.id === session?.user?.id;
  const isPlayer2 = team.player2?.id === session?.user?.id;
  const w = team.totalWins;
  const l = team.totalLosses;
  const total = team.totalMatchesPlayed;
  const winRate = total > 0 ? Math.round((w / total) * 100) : 0;

  // Sort season stats by date (most recent first)
  const sortedSeasonStats = [...team.seasonStats].sort(
    (a, b) => new Date(b.season.startDate).getTime() - new Date(a.season.startDate).getTime()
  );

  const teamDisplayName = team.name || `${team.player1.name.split(" ")[0]} & ${team.player2.name.split(" ")[0]}`;

  return (
    <>
      <PageHero 
        title={teamDisplayName} 
        description={team.isActive ? "Active Team" : "Inactive Team"}
      />
      <div className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          
          {/* Back Link */}
          <Link href="/teams" className="inline-flex items-center text-text-secondary hover:text-accent mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2"/>Back to Teams
          </Link>

          {/* Team Header with Composite Avatar */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Team Image or Composite Avatar */}
              <div className="relative">
                {team.image ? (
                  <div className="relative">
                    <Avatar 
                      src={team.image} 
                      alt={teamDisplayName}
                      fallback={teamDisplayName.charAt(0)}
                      size="xl"
                      className="border-2 border-accent"
                    />
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="relative z-10">
                      <Avatar 
                        src={team.player1.image || undefined} 
                        alt={team.player1.name} 
                        fallback={team.player1.name.charAt(0)} 
                        size="xl"
                        className="border-2 border-accent"
                      />
                    </div>
                    <div className="relative -ml-4 z-20">
                      <Avatar 
                        src={team.player2.image || undefined} 
                        alt={team.player2.name} 
                        fallback={team.player2.name.charAt(0)} 
                        size="xl"
                        className="border-2 border-accent"
                      />
                    </div>
                  </div>
                )}
                {team.isActive && (
                  <Badge variant="accent" className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <Crown className="h-3 w-3 mr-1"/>Active
                  </Badge>
                )}
              </div>

              {/* Team Info */}
              <div className="flex-1">
                {isEditing && isCreator ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">Team Name</label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="The Dynamic Duo"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">Team Image URL</label>
                      <Input
                        value={editImage}
                        onChange={(e) => setEditImage(e.target.value)}
                        placeholder="https://example.com/team-image.jpg"
                        className="w-full"
                      />
                      <p className="text-xs text-text-muted mt-1">Leave empty to show player avatars instead</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveTeamEdits} isLoading={isSaving} size="sm">
                        <Save className="h-4 w-4 mr-2"/>Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4 mr-2"/>Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-text-primary">{teamDisplayName}</h2>
                      {isCreator && (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                          <Edit2 className="h-4 w-4"/>
                        </Button>
                      )}
                    </div>
                    
                    {/* Player Links */}
                    <div className="flex items-center gap-4 mb-4">
                      <Link href={`/profile/${team.player1.id}`} className="flex items-center gap-2 hover:text-accent transition-colors">
                        <Avatar src={team.player1.image || undefined} alt={team.player1.name} fallback={team.player1.name.charAt(0)} size="sm"/>
                        <span className="text-sm">{team.player1.name}</span>
                        {team.player1.id === session?.user?.id && <Badge variant="accent" size="sm">You</Badge>}
                      </Link>
                      <span className="text-text-muted">&</span>
                      <Link href={`/profile/${team.player2.id}`} className="flex items-center gap-2 hover:text-accent transition-colors">
                        <Avatar src={team.player2.image || undefined} alt={team.player2.name} fallback={team.player2.name.charAt(0)} size="sm"/>
                        <span className="text-sm">{team.player2.name}</span>
                        {team.player2.id === session?.user?.id && <Badge variant="accent" size="sm">You</Badge>}
                      </Link>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Badge className="text-lg px-3 py-1">{team.foreverElo} ELO</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                        <div><p className="text-xl font-bold text-yellow-500">{w}</p><p className="text-xs text-text-muted">Wins</p></div>
                        <div><p className="text-xl font-bold text-red-400">{l}</p><p className="text-xs text-text-muted">Losses</p></div>
                        <div><p className="text-xl font-bold text-accent">{winRate}%</p><p className="text-xs text-text-muted">Rate</p></div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              {!isEditing && (
                <div className="flex gap-2">
                  {isMember && team.isActive && isPlayer2 && (
                    <Button variant="ghost" size="sm" onClick={leaveTeam} className="text-red-500">
                      Leave Team
                    </Button>
                  )}
                  {isMember && team.isActive && isCreator && (
                    <Button variant="ghost" size="sm" onClick={deactivateTeam} className="text-red-500">
                      Deactivate
                    </Button>
                  )}
                  {!team.isActive && isMember && (
                    <Button onClick={reactivateTeam} variant="accent">
                      <Sparkles className="h-4 w-4 mr-2"/>Reactivate
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Season History */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent"/>Season History
            </h3>
            
            {sortedSeasonStats.length === 0 ? (
              <p className="text-text-secondary text-center py-8">No season stats yet</p>
            ) : (
              <div className="space-y-4">
                {sortedSeasonStats.map((stat) => {
                  const statWinRate = stat.matchesPlayed > 0 
                    ? Math.round((stat.wins / stat.matchesPlayed) * 100) 
                    : 0;
                  return (
                    <div key={stat.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-bg-secondary rounded-lg gap-4">
                      <div className="flex items-center gap-4">
                        {stat.season.isActive ? (
                          <Crown className="h-5 w-5 text-yellow-500"/>
                        ) : (
                          <Calendar className="h-5 w-5 text-text-muted"/>
                        )}
                        <div>
                          <p className="font-medium">{stat.season.name}</p>
                          <p className="text-sm text-text-muted">
                            {stat.matchesPlayed} matches
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                        <div className="text-center">
                          <p className="text-lg font-bold">{stat.seasonElo}</p>
                          <p className="text-xs text-text-muted">Season ELO</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-yellow-500">{stat.wins}W</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-400">{stat.losses}L</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-accent">{statWinRate}%</p>
                          <p className="text-xs text-text-muted">Win Rate</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* ELO History Chart */}
          {eloHistory.length > 0 && (
            <Card className="p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-accent"/>Team ELO History
                </h3>
                {/* Timeframe filters */}
                <div className="inline-flex h-8 items-center rounded-lg bg-bg-secondary p-1">
                  {(['week', 'month', 'season', 'all'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setEloTimeframe(tf)}
                      className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        eloTimeframe === tf
                          ? 'bg-bg-primary text-text-primary shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {tf.charAt(0).toUpperCase() + tf.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {eloStats && (
                <div className="flex items-center gap-4 text-xs sm:text-sm mb-4">
                  <span className="text-green-500">↑ {eloStats.highestElo} High</span>
                  <span className="text-red-500">↓ {eloStats.lowestElo} Low</span>
                  <span className="text-text-secondary">{eloHistory.length} matches</span>
                </div>
              )}
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={eloHistory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="createdAt" 
                      stroke="#888"
                      fontSize={10}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke="#888"
                      fontSize={10}
                      domain={['dataMin - 50', 'dataMax + 50']}
                      width={35}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value) => [`${value} ELO`, 'Rating']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="eloAfter" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: '#8b5cf6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

        </div>
      </div>

      {/* Team Head-to-Head Modal */}
      {headToHeadOpen && headToHeadData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <Swords className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="truncate">{teamDisplayName} vs {headToHeadData.teams?.team2?.name || 'Team'}</span>
              </h2>
              <button
                onClick={() => setHeadToHeadOpen(false)}
                className="text-text-secondary hover:text-text-primary p-2"
              >
                ✕
              </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="text-center p-2 sm:p-4 bg-bg-secondary rounded-xl">
                <div className="text-xl sm:text-2xl font-bold text-green-500">
                  {headToHeadData.stats?.team1Wins || 0}
                </div>
                <div className="text-xs sm:text-sm text-text-secondary truncate">{teamDisplayName}</div>
              </div>
              <div className="text-center p-2 sm:p-4 bg-bg-secondary rounded-xl">
                <div className="text-xl sm:text-2xl font-bold text-text-primary">
                  {headToHeadData.stats?.totalMatches || 0}
                </div>
                <div className="text-xs sm:text-sm text-text-secondary">Matches</div>
              </div>
              <div className="text-center p-2 sm:p-4 bg-bg-secondary rounded-xl">
                <div className="text-xl sm:text-2xl font-bold text-purple-500">
                  {headToHeadData.stats?.team2Wins || 0}
                </div>
                <div className="text-xs sm:text-sm text-text-secondary truncate">{headToHeadData.teams?.team2?.name || 'Opponent'}</div>
              </div>
            </div>

            {/* Match History */}
            <h3 className="font-semibold mb-2 sm:mb-3">Match History</h3>
            {headToHeadData.matches?.length > 0 ? (
              <div className="space-y-2">
                {headToHeadData.matches.slice(0, 10).map((match: any) => (
                  <div
                    key={match.id}
                    className={`p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                      match.team1Won ? 'bg-green-500/10' : 'bg-purple-500/10'
                    }`}
                  >
                    <div className="text-sm sm:text-base">
                      <span className={match.team1Won ? 'text-green-500 font-bold' : 'text-purple-500'}>
                        {match.team1Won ? teamDisplayName : headToHeadData.teams?.team2?.name}
                      </span>
                      {' defeated '}
                      <span className={match.team1Won ? 'text-purple-500' : 'text-green-500 font-bold'}>
                        {match.team1Won ? headToHeadData.teams?.team2?.name : teamDisplayName}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-sm sm:text-base">{match.team1Score}-{match.team2Score}</div>
                      <div className="text-xs text-text-secondary">
                        {new Date(match.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-center py-4">No matches found</p>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
