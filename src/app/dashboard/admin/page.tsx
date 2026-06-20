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
  status: string;
  matchType: string;
  participants: number;
  maxParticipants: number;
  format: string;
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
                          <p className="font-medium text-text-primary">{user.name}</p>
                          {user.role === 'ADMIN' && (
                            <Badge variant="primary" size="sm">Admin</Badge>
                          )}
                          {user.isBanned && (
                            <Badge variant="danger" size="sm">Banned</Badge>
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
                        <Button variant="ghost" size="icon" title="Edit User">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user.isBanned ? (
                          <Button variant="ghost" size="icon" title="Unban User">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" title="Ban User">
                            <Ban className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Delete User">
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
                        <span className="font-bold">{match.player1Score}</span>
                        <span className="text-text-muted mx-1">-</span>
                        <span className="font-bold">{match.player2Score}</span>
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
                          <Button variant="ghost" size="icon" title="Edit Match">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Delete Match">
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
                    <div>
                      <h4 className="font-semibold text-text-primary">{tournament.name}</h4>
                      <p className="text-sm text-text-secondary">{tournament.format.replace('_', ' ')}</p>
                    </div>
                    <Badge 
                      variant={tournament.status === 'IN_PROGRESS' ? 'primary' : 'success'}
                    >
                      {tournament.status === 'IN_PROGRESS' ? 'In Progress' : 'Registration Open'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Match Type</span>
                      <span className="font-medium">{tournament.matchType}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Participants</span>
                      <span className="font-medium">{tournament.participants}/{tournament.maxParticipants}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Bracket
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Settings
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
                    <p className="text-sm text-text-secondary">ELO change multiplier for 0-10 games</p>
                  </div>
                  <Badge variant="primary">64</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">K-Factor (Established)</p>
                    <p className="text-sm text-text-secondary">ELO change multiplier for 31-100 games</p>
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
                    <p className="font-medium">3rd/4th Place Prize</p>
                    <p className="text-sm text-text-secondary">Each place gets</p>
                  </div>
                  <Badge variant="accent">{Math.round(TOURNAMENT_PRIZE_DISTRIBUTION.thirdFourth * 100)}%</Badge>
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
        )}
      </div>
    </>
  );
}
