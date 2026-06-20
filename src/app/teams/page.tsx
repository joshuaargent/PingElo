'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Users, Plus, Trash2 } from "lucide-react";

interface Team {
  id: string;
  name: string | null;
  foreverElo: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  player1: { id: string; name: string; image: string | null; doublesForeverElo: number };
  player2: { id: string; name: string; image: string | null; doublesForeverElo: number };
}

interface Player {
  id: string;
  name: string;
  image: string | null;
  doublesForeverElo: number;
}

export default function TeamsPage() {
  const { data: session, status } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState("");
  const [teamName, setTeamName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) redirect("/auth/signin");
    fetchData();
  }, [session, status]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [teamsRes, playersRes] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/users?includeStats=true"),
      ]);
      if (teamsRes.ok) setTeams((await teamsRes.json()).teams || []);
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
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: selectedPartner, name: teamName || null }),
      });
      if (res.ok) {
        setShowModal(false);
        setSelectedPartner("");
        setTeamName("");
        fetchData();
      } else {
        alert((await res.json()).error || "Failed");
      }
    } catch { alert("Failed"); }
    finally { setIsCreating(false); }
  }

  async function deleteTeam(teamId: string) {
    if (!confirm("Delete this team?")) return;
    const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
    if (res.ok) setTeams(teams.filter(t => t.id !== teamId));
  }

  const available = allPlayers.filter(p => p.id !== session?.user?.id && !teams.some(t => t.player1.id === p.id || t.player2.id === p.id));

  if (status === "loading" || isLoading) {
    return <div className="flex justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"/></div>;
  }

  return (
    <>
      <PageHero title="My Teams" description="Manage your doubles partnerships" />
      <div className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="flex justify-between items-center mb-8">
            <p className="text-text-secondary">Form teams with others for doubles tournaments</p>
            <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-2"/>Create Team</Button>
          </div>

          {teams.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto text-text-muted mb-4"/>
              <h3 className="text-lg font-semibold text-text-primary mb-2">No Teams Yet</h3>
              <p className="text-text-secondary mb-6">Create a team to join doubles tournaments</p>
              <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-2"/>Create Team</Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {teams.map(team => {
                const w = team.wins || 0, l = team.losses || 0, total = w + l;
                return (
                  <Card key={team.id} className="p-6 hover:shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-text-primary text-lg">
                          {team.name || team.player1.name.split(" ")[0] + " & " + team.player2.name.split(" ")[0]}
                        </h3>
                        <Badge className="mt-1">{team.foreverElo} Team ELO</Badge>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteTeam(team.id)} className="text-red-500">
                        <Trash2 className="h-4 w-4"/>
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Avatar src={team.player1.image || undefined} alt={team.player1.name} fallback={team.player1.name.charAt(0)} size="sm"/>
                        <div>
                          <p className="text-sm font-medium">{team.player1.name}{team.player1.id === session?.user?.id && <span className="text-accent ml-1">(You)</span>}</p>
                          <p className="text-xs text-text-muted">{team.player1.doublesForeverElo} Doubles ELO</p>
                        </div>
                      </div>
                      <span className="text-text-muted">&</span>
                      <div className="flex items-center gap-2">
                        <Avatar src={team.player2.image || undefined} alt={team.player2.name} fallback={team.player2.name.charAt(0)} size="sm"/>
                        <div>
                          <p className="text-sm font-medium">{team.player2.name}{team.player2.id === session?.user?.id && <span className="text-accent ml-1">(You)</span>}</p>
                          <p className="text-xs text-text-muted">{team.player2.doublesForeverElo} Doubles ELO</p>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Create a Team</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Team Name (Optional)</label>
                <input type="text" placeholder="The Dynamic Duo" value={teamName} onChange={e => setTeamName(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent"/>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Select Partner *</label>
                <select value={selectedPartner} onChange={e => setSelectedPartner(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent">
                  <option value="">Choose...</option>
                  {available.map(p => <option key={p.id} value={p.id}>{p.name} ({p.doublesForeverElo} ELO)</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => { setShowModal(false); setSelectedPartner(""); setTeamName(""); }} className="flex-1">Cancel</Button>
              <Button onClick={createTeam} isLoading={isCreating} disabled={!selectedPartner} className="flex-1">Create</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}