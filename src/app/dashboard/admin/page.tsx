'use client';
import { PageHero } from '@/components/layout/PageHero';
import { TOURNAMENT_HOUSE_INJECTION, TOURNAMENT_PRIZE_DISTRIBUTION } from '@/lib/elo';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar } from '@/components/ui/Avatar';
import { 
  Users, 
  Trophy, 
  TrendingUp,
  Shield,
  Settings,
  Search,
  Ban,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  Flag,
  RefreshCw,
} from 'lucide-react';

type Tab = 'overview' | 'users' | 'matches' | 'tournaments' | 'settings';

interface SiteStats {
  totalUsers: number;
  totalMatches: number;
  activeTournaments: number;
  avgElo: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  foreverElo: number;
  matchesPlayed: number;
  role: string;
  isBanned: boolean;
  banReason: string | null;
  createdAt: string;
}

interface Match {
  id: string;
  player1: { name: string };
  player2: { name: string };
  player1Score: number;
  player2Score: number;
  winnerId: string;
  isTournamentMatch: boolean;
  createdBy: { name: string };
  createdAt: string;
}

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  status: string;
  matchType: string;
  participantCount: number;
  participants?: Array<{ id: string; userId?: string | null; teamId?: string | null }>;
  maxParticipants: number;
  format: string;
  entryFee: number;
  prizePool: number;
  maxScore: number;
  startsAt: string | null;
  creatorId: string;
}

// ============================================
// Admin Dashboard Page
// ============================================

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [siteStats, setSiteStats] = useState<SiteStats>({ totalUsers: 0, totalMatches: 0, activeTournaments: 0, avgElo: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState({ name: '', image: '', foreverElo: 0, seasonElo: 0 });
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editingMatchScore, setEditingMatchScore] = useState({ p1: 0, p2: 0 });
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(null);
  const [editingTournament, setEditingTournament] = useState({ 
    name: '', 
    description: '',
    entryFee: 0, 
    prizePool: 0,
    maxParticipants: 0,
    maxScore: 21,
    format: 'SINGLE_ELIMINATION',
    matchType: 'SINGLES',
    startsAt: ''
  });

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    
    // Get role from session user
    const userRole = (session?.user as any)?.role;
    console.log('Admin check - role:', userRole, 'session:', JSON.stringify(session?.user));
    
    if (userRole !== 'ADMIN') {
      console.log('Not admin, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch users
        const usersRes = await fetch('/api/users?includeStats=true');
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users || []);
          
          // Calculate stats
          const totalElo = (data.users || []).reduce((sum: number, u: User) => sum + u.foreverElo, 0);
          setSiteStats({
            totalUsers: data.users?.length || 0,
            totalMatches: 0,
            activeTournaments: 0,
            avgElo: data.users?.length ? Math.round(totalElo / data.users.length) : 0,
          });
        }

        // Fetch matches
        const matchesRes = await fetch('/api/matches?limit=20');
        if (matchesRes.ok) {
          const data = await matchesRes.json();
          setMatches(data.matches || []);
          setSiteStats(prev => ({ ...prev, totalMatches: data.matches?.length || 0 }));
        }

        // Fetch tournaments
        const tournamentsRes = await fetch('/api/tournaments');
        if (tournamentsRes.ok) {
          const data = await tournamentsRes.json();
          const active = (data.tournaments || []).filter((t: Tournament) => t.status === 'IN_PROGRESS' || t.status === 'REGISTRATION_OPEN');
          setTournaments(data.tournaments || []);
          setSiteStats(prev => ({ ...prev, activeTournaments: active.length }));
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (session?.user) {
      fetchData();
    }
  }, [session?.user]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
                <p className="text-text-secondary">Manage users, matches, and tournaments</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <div className="container mx-auto px-4 pb-16">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'matches', label: 'Matches', icon: Activity },
            { id: 'tournaments', label: 'Tournaments', icon: Trophy },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent text-white'
                  : 'bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-secondary/80'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{siteStats.totalUsers}</p>
                    <p className="text-sm text-text-secondary">Total Users</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Activity className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{siteStats.totalMatches}</p>
                    <p className="text-sm text-text-secondary">Total Matches</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{siteStats.activeTournaments}</p>
                    <p className="text-sm text-text-secondary">Tournaments</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{siteStats.avgElo}</p>
                    <p className="text-sm text-text-secondary">Average ELO</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Matches */}
            <Card className="p-6">
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                Recent Matches
              </h3>
              {matches.length > 0 ? (
                <div className="space-y-4">
                  {matches.slice(0, 5).map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="font-medium">{match.player1.name}</p>
                          <p className="text-2xl font-bold text-accent">{match.player1Score}</p>
                        </div>
                        <div className="text-text-muted">vs</div>
                        <div className="text-center">
                          <p className="font-medium">{match.player2.name}</p>
                          <p className="text-2xl font-bold">{match.player2Score}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-center py-8">No matches yet</p>
              )}
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="outline">{filteredUsers.length} users</Badge>
            </div>

            {/* User List */}
            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={user.image}
                        alt={user.name}
                        fallback={user.name.charAt(0)}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          {editingUserId === user.id ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingUser.name}
                                  onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="Name"
                                  className="h-8 w-40"
                                  autoFocus
                                />
                                <Input
                                  value={editingUser.image}
                                  onChange={(e) => setEditingUser(prev => ({ ...prev, image: e.target.value }))}
                                  placeholder="Avatar URL"
                                  className="h-8 w-40"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={editingUser.foreverElo}
                                  onChange={(e) => setEditingUser(prev => ({ ...prev, foreverElo: parseInt(e.target.value) || 0 }))}
                                  placeholder="Forever ELO"
                                  className="h-8 w-28"
                                />
                                <Input
                                  type="number"
                                  value={editingUser.seasonElo}
                                  onChange={(e) => setEditingUser(prev => ({ ...prev, seasonElo: parseInt(e.target.value) || 0 }))}
                                  placeholder="Season ELO"
                                  className="h-8 w-28"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/users/${user.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ 
                                        name: editingUser.name,
                                        image: editingUser.image || null,
                                        foreverElo: editingUser.foreverElo,
                                        seasonElo: editingUser.seasonElo
                                      })
                                    });
                                    if (res.ok) {
                                      setUsers(prev => prev.map(u => u.id === user.id ? { 
                                        ...u, 
                                        name: editingUser.name,
                                        image: editingUser.image || null,
                                        foreverElo: editingUser.foreverElo,
                                        seasonElo: editingUser.seasonElo
                                      } : u));
                                      setEditingUserId(null);
                                    } else {
                                      alert('Failed to update user');
                                    }
                                  } catch {
                                    alert('Failed to update user');
                                  }
                                }}>Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingUserId(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="font-medium text-text-primary">{user.name}</p>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                setEditingUserId(user.id);
                                setEditingUser({
                                  name: user.name,
                                  image: user.image || '',
                                  foreverElo: user.foreverElo,
                                  seasonElo: user.foreverElo // Use foreverElo as proxy for season
                                });
                              }}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              {user.role === 'ADMIN' && (
                                <Badge variant="primary" size="sm">Admin</Badge>
                              )}
                              {user.isBanned && (
                                <Badge variant="danger" size="sm">Banned</Badge>
                              )}
                            </>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-bold text-text-primary">{user.foreverElo} ELO</p>
                        <p className="text-sm text-text-secondary">{user.matchesPlayed} matches</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.isBanned ? (
                          <Button variant="ghost" size="icon" title="Unban User" onClick={async () => {
                            try {
                              const res = await fetch(`/api/users/${user.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ isBanned: false, banReason: '' })
                              });
                              if (res.ok) {
                                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isBanned: false, banReason: null } : u));
                              }
                            } catch (err) {
                              alert('Failed to unban user');
                            }
                          }}>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" title="Ban User" onClick={async () => {
                            const reason = prompt('Enter ban reason:');
                            if (reason === null) return;
                            try {
                              const res = await fetch(`/api/users/${user.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ isBanned: true, banReason: reason || 'No reason provided' })
                              });
                              if (res.ok) {
                                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isBanned: true, banReason: reason || 'No reason provided' } : u));
                              }
                            } catch (err) {
                              alert('Failed to ban user');
                            }
                          }}>
                            <Ban className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Delete User" onClick={async () => {
                          if (!confirm(`Are you sure you want to delete ${user.name}? This cannot be undone.`)) return;
                          try {
                            const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              setUsers(prev => prev.filter(u => u.id !== user.id));
                            } else {
                              const data = await res.json();
                              alert('Error: ' + data.error);
                            }
                          } catch (err) {
                            alert('Failed to delete user');
                          }
                        }}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {user.isBanned && user.banReason && (
                    <div className="mt-3 p-3 bg-red-500/10 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600 dark:text-red-400">{user.banReason}</span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Match</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Score</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Created By</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Date</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {matches.map((match) => (
                    <tr key={match.id} className="hover:bg-bg-secondary/50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{match.player1.name} vs {match.player2.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        {editingMatchId === match.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="21"
                              value={editingMatchScore.p1}
                              onChange={(e) => setEditingMatchScore(prev => ({ ...prev, p1: parseInt(e.target.value) || 0 }))}
                              className="w-16 h-8"
                            />
                            <span className="text-text-muted">-</span>
                            <Input
                              type="number"
                              min="0"
                              max="21"
                              value={editingMatchScore.p2}
                              onChange={(e) => setEditingMatchScore(prev => ({ ...prev, p2: parseInt(e.target.value) || 0 }))}
                              className="w-16 h-8"
                            />
                            <Button size="sm" onClick={async () => {
                              try {
                                const res = await fetch(`/api/matches/${match.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ player1Score: editingMatchScore.p1, player2Score: editingMatchScore.p2 })
                                });
                                if (res.ok) {
                                  setMatches(prev => prev.map(m => m.id === match.id ? { ...m, player1Score: editingMatchScore.p1, player2Score: editingMatchScore.p2 } : m));
                                  setEditingMatchId(null);
                                  alert('Match updated');
                                } else {
                                  const data = await res.json();
                                  alert('Error: ' + data.error);
                                }
                              } catch {
                                alert('Failed to update match');
                              }
                            }}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingMatchId(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <>
                            <span className="font-bold">{match.player1Score}</span>
                            <span className="text-text-muted mx-1">-</span>
                            <span className="font-bold">{match.player2Score}</span>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {match.isTournamentMatch ? (
                          <Badge variant="primary" size="sm">Tournament</Badge>
                        ) : (
                          <Badge variant="outline" size="sm">Casual</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {match.createdBy.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {new Date(match.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Edit Match" onClick={() => {
                            setEditingMatchId(match.id);
                            setEditingMatchScore({ p1: match.player1Score, p2: match.player2Score });
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Delete Match" onClick={() => {
                            if (!confirm('Are you sure you want to delete this match?')) return;
                            fetch('/api/admin/delete-match', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ matchId: match.id, revertElo: true })
                            })
                            .then(res => res.json())
                            .then(data => {
                              if (data.success) {
                                alert('Match deleted');
                                setMatches(prev => prev.filter(m => m.id !== match.id));
                              } else {
                                alert('Error: ' + data.error);
                              }
                            })
                            .catch(err => alert('Failed to delete match'));
                          }}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {matches.length === 0 && (
                <div className="p-12 text-center text-text-secondary">
                  No matches found
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tournament Management</h3>
              <Button>Create Tournament</Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => (
                <Card key={tournament.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      {editingTournamentId === tournament.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editingTournament.name}
                            onChange={(e) => setEditingTournament(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Tournament name"
                          />
                          <Textarea
                            value={editingTournament.description}
                            onChange={(e) => setEditingTournament(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Description"
                            rows={2}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              value={editingTournament.entryFee}
                              onChange={(e) => setEditingTournament(prev => ({ ...prev, entryFee: parseInt(e.target.value) || 0 }))}
                              placeholder="Entry Fee"
                            />
                            <Input
                              type="number"
                              value={editingTournament.maxParticipants}
                              onChange={(e) => setEditingTournament(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 0 }))}
                              placeholder="Max Players"
                            />
                            <Input
                              type="number"
                              value={editingTournament.maxScore}
                              onChange={(e) => setEditingTournament(prev => ({ ...prev, maxScore: parseInt(e.target.value) || 21 }))}
                              placeholder="Max Score"
                            />
                            <Input
                              type="datetime-local"
                              value={editingTournament.startsAt?.slice(0, 16) || ''}
                              onChange={(e) => setEditingTournament(prev => ({ ...prev, startsAt: e.target.value }))}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={async () => {
                              try {
                                const res = await fetch(`/api/tournaments/${tournament.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    name: editingTournament.name,
                                    description: editingTournament.description,
                                    entryFee: editingTournament.entryFee,
                                    maxParticipants: editingTournament.maxParticipants,
                                    maxScore: editingTournament.maxScore,
                                    startsAt: editingTournament.startsAt || null
                                  })
                                });
                                if (res.ok) {
                                  setTournaments(prev => prev.map(t => t.id === tournament.id ? {
                                    ...t,
                                    name: editingTournament.name,
                                    description: editingTournament.description,
                                    entryFee: editingTournament.entryFee,
                                    maxParticipants: editingTournament.maxParticipants,
                                    maxScore: editingTournament.maxScore,
                                    startsAt: editingTournament.startsAt
                                  } : t));
                                  setEditingTournamentId(null);
                                } else {
                                  const data = await res.json();
                                  alert('Error: ' + data.error);
                                }
                              } catch {
                                alert('Failed to update tournament');
                              }
                            }}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingTournamentId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-semibold text-text-primary">{tournament.name}</h4>
                          {tournament.description && (
                            <p className="text-sm text-text-secondary mt-1">{tournament.description}</p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge 
                        variant={tournament.status === 'IN_PROGRESS' ? 'primary' : 'success'}
                      >
                        {tournament.status === 'IN_PROGRESS' ? 'In Progress' : 'Registration Open'}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingTournamentId(tournament.id);
                        setEditingTournament({
                          name: tournament.name,
                          description: tournament.description || '',
                          entryFee: tournament.entryFee,
                          prizePool: tournament.prizePool,
                          maxParticipants: tournament.maxParticipants,
                          maxScore: tournament.maxScore,
                          format: tournament.format,
                          matchType: tournament.matchType,
                          startsAt: tournament.startsAt || ''
                        });
                      }}>
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Format</span>
                      <span className="font-medium">{tournament.format.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Match Type</span>
                      <span className="font-medium">{tournament.matchType}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Entry Fee</span>
                      <span className="font-medium">{tournament.entryFee} ELO</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Prize Pool</span>
                      <span className="font-medium">{tournament.prizePool} ELO</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Players</span>
                      <span className="font-medium">{tournament.participantCount}/{tournament.maxParticipants}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Max Score</span>
                      <span className="font-medium">{tournament.maxScore}</span>
                    </div>
                    {tournament.startsAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Starts</span>
                        <span className="font-medium">{new Date(tournament.startsAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => router.push(`/tournaments/${tournament.id}`)}
                    >
                      View Bracket
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        const confirmDelete = confirm('Are you sure you want to delete this tournament? This cannot be undone.');
                        if (!confirmDelete) return;
                        
                        fetch(`/api/tournaments/${tournament.id}`, { method: 'DELETE' })
                          .then(res => res.json())
                          .then(data => {
                            if (data.success) {
                              alert('Tournament deleted');
                              setTournaments(prev => prev.filter(t => t.id !== tournament.id));
                            } else {
                              alert('Error: ' + data.error);
                            }
                          })
                          .catch(err => alert('Failed to delete tournament'));
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            {tournaments.length === 0 && (
              <Card className="p-12 text-center">
                <Trophy className="h-12 w-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">No Tournaments</h3>
                <p className="text-text-secondary">Create your first tournament!</p>
              </Card>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-text-primary mb-4">Data Integrity</h3>
              <p className="text-sm text-text-secondary mb-4">
                Use these tools to manage ELO data integrity.
              </p>
              <Button
                variant="danger"
                onClick={async () => {
                  if (!confirm('Are you sure? This will recalculate ALL ELO values from match history. This cannot be undone!')) return;
                  if (!confirm(' REALLY - This is destructive! All ELO will be recalculated from scratch.')) return;
                  
                  try {
                    const res = await fetch('/api/admin/recalculate-elo', { method: 'POST' });
                    const data = await res.json();
                    if (res.ok) {
                      alert('ELO recalculated successfully! ' + data.message);
                    } else {
                      alert('Error: ' + data.error);
                    }
                  } catch (err) {
                    alert('Failed to recalculate ELO');
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalculate All ELO
              </Button>
              <p className="text-xs text-text-muted mt-2">
                This recalculates all ELO from scratch based on match history. Use with caution.
              </p>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-text-primary mb-4">ELO Settings</h3>
              <p className="text-sm text-text-secondary mb-4">
                These values are defined in code and cannot be changed via the admin dashboard.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">Starting ELO</p>
                    <p className="text-sm text-text-secondary">Default ELO for new users</p>
                  </div>
                  <Badge variant="primary">1000</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">K-Factor (New Players)</p>
                    <p className="text-sm text-text-secondary">ELO change multiplier for 0-9 games</p>
                  </div>
                  <Badge variant="primary">64</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">K-Factor (Established)</p>
                    <p className="text-sm text-text-secondary">ELO change multiplier for 30-99 games</p>
                  </div>
                  <Badge variant="primary">32</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-text-primary mb-4">Tournament Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">House Injection</p>
                    <p className="text-sm text-text-secondary">ELO added to each tournament prize pool</p>
                  </div>
                  <Badge variant="accent">{TOURNAMENT_HOUSE_INJECTION} ELO</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">1st Place Prize</p>
                    <p className="text-sm text-text-secondary">Percentage of prize pool</p>
                  </div>
                  <Badge variant="accent">{Math.round(TOURNAMENT_PRIZE_DISTRIBUTION.first * 100)}%</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">2nd Place Prize</p>
                    <p className="text-sm text-text-secondary">Percentage of prize pool</p>
                  </div>
                  <Badge variant="accent">{Math.round(TOURNAMENT_PRIZE_DISTRIBUTION.second * 100)}%</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">3rd Place Prize</p>
                    <p className="text-sm text-text-secondary">Percentage of prize pool</p>
                  </div>
                  <Badge variant="accent">{Math.round(TOURNAMENT_PRIZE_DISTRIBUTION.third * 100)}%</Badge>
                </div>
              </div>
              <div className="mt-4 p-4 bg-accent/10 border border-accent/30 rounded-lg">
                <p className="text-sm text-text-secondary">
                  <Flag className="h-4 w-4 inline mr-2 text-accent" />
                  To change these values, edit <code className="bg-bg-primary px-1 rounded">src/lib/elo.ts</code>
                </p>
              </div>
            </Card>
          </div>
          </div>
        )}
      </div>
    </>
  );
}
