'use client';

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
  XCircle,
  Clock,
  Activity,
  BarChart3,
  Flag,
  RefreshCw,
  TrendingDown
} from 'lucide-react';

// ============================================
// Mock Data - Replace with API calls
// ============================================

const mockSiteStats = {
  totalUsers: 48,
  totalMatches: 156,
  activeTournaments: 3,
  totalEloInCirculation: 48000,
  avgElo: 1000,
  newUsersThisWeek: 5,
  matchesThisWeek: 23,
};

const mockUsers = [
  { id: '1', name: 'Alex Chen', email: 'alex@example.com', image: null, foreverElo: 1285, matchesPlayed: 45, role: 'PLAYER', isBanned: false, banReason: null, createdAt: new Date('2024-01-15') },
  { id: '2', name: 'Sarah Miller', email: 'sarah@example.com', image: null, foreverElo: 1240, matchesPlayed: 38, role: 'PLAYER', isBanned: false, banReason: null, createdAt: new Date('2024-01-10') },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', image: null, foreverElo: 1198, matchesPlayed: 52, role: 'ADMIN', isBanned: false, banReason: null, createdAt: new Date('2024-01-01') },
  { id: '4', name: 'Emma Wilson', email: 'emma@example.com', image: null, foreverElo: 1156, matchesPlayed: 29, role: 'PLAYER', isBanned: false, banReason: null, createdAt: new Date('2024-02-01') },
  { id: '5', name: 'James Brown', email: 'james@example.com', image: null, foreverElo: 1105, matchesPlayed: 22, role: 'PLAYER', isBanned: true, banReason: 'Inappropriate behavior', createdAt: new Date('2024-02-15') },
];

const mockRecentMatches = [
  { id: '1', player1: { name: 'Alex Chen' }, player2: { name: 'Sarah Miller' }, player1Score: 21, player2Score: 18, winnerId: '1', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), isTournament: false, createdBy: { name: 'Alex Chen' } },
  { id: '2', player1: { name: 'Mike Johnson' }, player2: { name: 'Emma Wilson' }, player1Score: 15, player2Score: 21, winnerId: '4', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), isTournament: false, createdBy: { name: 'Mike Johnson' } },
  { id: '3', player1: { name: 'James Brown' }, player2: { name: 'Alex Chen' }, player1Score: 21, player2Score: 12, winnerId: '3', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), isTournament: true, createdBy: { name: 'Admin' } },
];

const mockTournaments = [
  { id: '1', name: 'Weekly Championship', status: 'IN_PROGRESS', matchType: 'SINGLES', participants: 8, maxParticipants: 8, format: 'SINGLE_ELIMINATION' },
  { id: '2', name: 'Doubles Cup', status: 'REGISTRATION_OPEN', matchType: 'DOUBLES', participants: 4, maxParticipants: 8, format: 'DOUBLE_ELIMINATION' },
  { id: '3', name: 'Swiss Tournament', status: 'REGISTRATION_OPEN', matchType: 'SINGLES', participants: 6, maxParticipants: 16, format: 'SWISS' },
];

// ============================================
// Types
// ============================================

type Tab = 'overview' | 'users' | 'matches' | 'tournaments' | 'settings';

// ============================================
// Admin Dashboard Page
// ============================================

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState(mockUsers);
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  if (status === 'loading' || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBanUser = async (userId: string) => {
    if (!confirm('Are you sure you want to ban this user?')) return;
    // API call would go here
    setUsers(users.map(u => u.id === userId ? { ...u, isBanned: true, banReason: 'Banned by admin' } : u));
  };

  const handleUnbanUser = async (userId: string) => {
    // API call would go here
    setUsers(users.map(u => u.id === userId ? { ...u, isBanned: false, banReason: null } : u));
  };

  const handleAdjustElo = async (userId: string, newElo: number) => {
    // API call would go here
    setUsers(users.map(u => u.id === userId ? { ...u, foreverElo: newElo } : u));
    setSelectedUser(null);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        </div>

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

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{mockSiteStats.totalUsers}</p>
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
                    <p className="text-2xl font-bold text-text-primary">{mockSiteStats.totalMatches}</p>
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
                    <p className="text-2xl font-bold text-text-primary">{mockSiteStats.activeTournaments}</p>
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
                    <p className="text-2xl font-bold text-text-primary">{mockSiteStats.avgElo}</p>
                    <p className="text-sm text-text-secondary">Average ELO</p>
                  </div>
                </div>
              </Card>
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
            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                Recent Matches
              </h3>
              <div className="space-y-4">
                {mockRecentMatches.map((match) => (
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
                    <div className="text-right">
                      {match.isTournament && <Badge variant="primary" size="sm">Tournament</Badge>}
                      <p className="text-xs text-text-muted mt-1">
                        by {match.createdBy.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab('users')}>
                  <Users className="h-6 w-6" />
                  <span>Manage Users</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab('matches')}>
                  <Edit className="h-6 w-6" />
                  <span>Review Matches</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab('tournaments')}>
                  <Trophy className="h-6 w-6" />
                  <span>Manage Tournaments</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <RefreshCw className="h-6 w-6" />
                  <span>Recalculate ELO</span>
                </Button>
              </div>
            </Card>

            {/* Active Tournaments */}
            <Card className="p-6 lg:col-span-2">
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Flag className="h-5 w-5 text-accent" />
                Active Tournaments
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {mockTournaments.map((tournament) => (
                  <div key={tournament.id} className="p-4 bg-bg-secondary rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{tournament.name}</h4>
                      <Badge 
                        variant={tournament.status === 'IN_PROGRESS' ? 'primary' : 'success'} 
                        size="sm"
                      >
                        {tournament.status === 'IN_PROGRESS' ? 'Active' : 'Open'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-text-secondary">
                      <span>{tournament.participants}/{tournament.maxParticipants} players</span>
                      <span>{tournament.format}</span>
                    </div>
                  </div>
                ))}
              </div>
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
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setSelectedUser(user)}
                          title="Adjust ELO"
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                        {user.isBanned ? (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleUnbanUser(user.id)}
                            title="Unban User"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleBanUser(user.id)}
                            title="Ban User"
                          >
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Match Management</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recalculate All ELO
                </Button>
              </div>
            </div>

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
                    {mockRecentMatches.map((match) => (
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
                          {match.isTournament ? (
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
              </div>
            </Card>
          </div>
        )}

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tournament Management</h3>
              <Button>Create Tournament</Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockTournaments.map((tournament) => (
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
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-text-primary mb-4">ELO Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">Starting ELO</p>
                    <p className="text-sm text-text-secondary">Default ELO for new users</p>
                  </div>
                  <Badge>1000</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">K-Factor (New Players)</p>
                    <p className="text-sm text-text-secondary">ELO change multiplier for 0-10 games</p>
                  </div>
                  <Badge>64</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">K-Factor (Established)</p>
                    <p className="text-sm text-text-secondary">ELO change multiplier for 31-100 games</p>
                  </div>
                  <Badge>32</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">K-Factor (Veterans)</p>
                    <p className="text-sm text-text-secondary">ELO change multiplier for 100+ games</p>
                  </div>
                  <Badge>24</Badge>
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
                  <Badge>500 ELO</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">1st Place Prize</p>
                    <p className="text-sm text-text-secondary">Percentage of prize pool</p>
                  </div>
                  <Badge>60%</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">Season Bonus</p>
                    <p className="text-sm text-text-secondary">Percentage added to forever ELO for season winner</p>
                  </div>
                  <Badge>10%</Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">
                <Settings className="h-4 w-4 mr-2" />
                Edit Settings
              </Button>
            </Card>

            <Card className="p-6 lg:col-span-2">
              <h3 className="font-semibold text-text-primary mb-4">Danger Zone</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg">
                  <div>
                    <p className="font-medium text-red-600 dark:text-red-400">Recalculate All ELO</p>
                    <p className="text-sm text-text-secondary">Revert all ELO to starting value and recalculate from match history</p>
                  </div>
                  <Button variant="danger" size="sm">
                    Recalculate
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg">
                  <div>
                    <p className="font-medium text-red-600 dark:text-red-400">Reset Season</p>
                    <p className="text-sm text-text-secondary">End current season and start a new one</p>
                  </div>
                  <Button variant="danger" size="sm">
                    Reset Season
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg">
                  <div>
                    <p className="font-medium text-red-600 dark:text-red-400">Delete All Data</p>
                    <p className="text-sm text-text-secondary">Permanently delete all matches and reset ELO</p>
                  </div>
                  <Button variant="danger" size="sm">
                    Delete All
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ELO Adjustment Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6 mx-4">
              <h3 className="text-lg font-semibold mb-4">Adjust ELO for {selectedUser.name}</h3>
              <p className="text-text-secondary mb-4">Current ELO: {selectedUser.foreverElo}</p>
              <Input
                type="number"
                label="New ELO"
                defaultValue={selectedUser.foreverElo}
                min={0}
                max={9999}
              />
              <div className="flex items-center justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleAdjustElo(selectedUser.id, selectedUser.foreverElo)}>
                  Save Changes
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
