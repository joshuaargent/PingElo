'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ChallengeCard } from '@/components/ui/ChallengeCard';
import { PageHero } from '@/components/layout/PageHero';
import { Swords, Users, Plus, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import Link from 'next/link';

interface Challenge {
  id: string;
  challengerId: string;
  challengedId: string;
  stakeAmount: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  isTeamChallenge: boolean;
  team1Id: string | null;
  team2Id: string | null;
  challenger: {
    id: string;
    name: string;
    image: string | null;
    foreverElo: number;
  };
  challenged: {
    id: string;
    name: string;
    image: string | null;
    foreverElo: number;
  };
}

// ============================================
// Challenges Page
// ============================================

export default function ChallengesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stakeAmount, setStakeAmount] = useState(5);
  const [selectedUserForChallenge, setSelectedUserForChallenge] = useState<any>(null);
  const [isTeamChallenge, setIsTeamChallenge] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session?.user) {
      redirect('/auth/signin');
    }
  }, [session, sessionStatus]);

  useEffect(() => {
    async function fetchChallenges() {
      if (!session?.user?.id) return;
      
      setIsLoading(true);
      try {
        const res = await fetch('/api/challenges');
        if (res.ok) {
          const data = await res.json();
          setChallenges(data.challenges || []);
        }
      } catch (error) {
        console.error('Failed to fetch challenges:', error);
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchUsers() {
      try {
        const res = await fetch('/api/users?limit=50');
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    }

    async function fetchTeams() {
      try {
        const res = await fetch('/api/teams');
        if (res.ok) {
          const data = await res.json();
          setTeams(data.teams || []);
        }
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      }
    }

    if (session?.user?.id) {
      fetchChallenges();
      fetchUsers();
      fetchTeams();
    }
  }, [session?.user?.id]);

  const filteredChallenges = challenges.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return c.status === 'PENDING';
    if (filter === 'accepted') return c.status === 'ACCEPTED';
    if (filter === 'completed') return c.status === 'COMPLETED';
    return true;
  });

  const pendingCount = challenges.filter(c => c.status === 'PENDING').length;
  const acceptedCount = challenges.filter(c => c.status === 'ACCEPTED').length;

  const handleChallenge = async (userId: string, stake: number, teamId?: string) => {
    try {
      const body: any = { challengedId: userId, stakeAmount: stake };
      
      if (isTeamChallenge && teamId) {
        body.isTeamChallenge = true;
        body.team1Id = teamId; // User's team (the challenger)
        body.team2Id = selectedTeam?.id; // Opponent's team
      }
      
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        // Refresh challenges
        const refreshRes = await fetch('/api/challenges');
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setChallenges(data.challenges || []);
        }
        setShowChallengeModal(false);
        setSelectedUserForChallenge(null);
        setIsTeamChallenge(false);
        setSelectedTeam(null);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create challenge');
      }
    } catch (error) {
      console.error('Failed to create challenge:', error);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (u.id === session?.user?.id) return false; // Don't show self
    if (!searchQuery) return true;
    return u.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filter teams for team challenges (exclude teams user is on)
  const filteredTeams = teams.filter((team: any) => {
    if (!isTeamChallenge) return false;
    // Don't show teams that include the current user as primary selection targets
    // (they can challenge other teams, but not their own team)
    if (!searchQuery) return true;
    const teamName = team.name || `Team ${team.player1?.name}${team.player2?.name ? ` & ${team.player2.name}` : ''}`;
    return teamName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get user's teams for selection
  const userTeams = teams.filter((team: any) => {
    return team.player1Id === session?.user?.id || team.player2Id === session?.user?.id;
  });

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHero
        title="Player Challenges"
        description="Challenge other players to ping pong matches"
      />

      {/* Content Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <Card className="p-4 text-center">
              <p className="text-xl sm:text-3xl font-bold text-yellow-500">{pendingCount}</p>
              <p className="text-sm text-text-secondary">Pending</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xl sm:text-3xl font-bold text-green-500">{acceptedCount}</p>
              <p className="text-sm text-text-secondary">Accepted</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xl sm:text-3xl font-bold text-text-primary">{challenges.length}</p>
              <p className="text-sm text-text-secondary">Total</p>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-accent text-white' 
                    : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  filter === 'pending' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('accepted')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  filter === 'accepted' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                Accepted
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  filter === 'completed' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                Completed
              </button>
            </div>
            <Button 
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setShowChallengeModal(true)}
              className="whitespace-nowrap"
            >
              New Challenge
            </Button>
          </div>

          {/* Challenge List */}
          {filteredChallenges.length > 0 ? (
            <div className="space-y-4">
              {filteredChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  currentUserId={session!.user.id}
                  onUpdate={() => {
                    // Refresh challenges
                    fetch('/api/challenges')
                      .then(res => res.json())
                      .then(data => setChallenges(data.challenges || []));
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Swords className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">No Challenges</h3>
              <p className="text-text-secondary mb-6">
                {filter === 'all' 
                  ? "You haven't sent or received any challenges yet." 
                  : `No ${filter} challenges found.`}
              </p>
              {filter === 'all' && (
                <Button onClick={() => setShowChallengeModal(true)}>
                  Issue Your First Challenge
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Challenge Modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Swords className="h-5 w-5 text-accent" />
                {isTeamChallenge ? 'Team Challenge' : selectedUserForChallenge ? 'Set the Stakes' : 'Challenge a Player'}
              </h2>
              <button 
                onClick={() => { setShowChallengeModal(false); setSelectedUserForChallenge(null); setStakeAmount(5); setIsTeamChallenge(false); setSelectedTeam(null); }}
                className="text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            {/* Initial selection screen - show teams for team challenges, players for singles */}
            {!selectedUserForChallenge && !selectedTeam ? (
              <>
                {/* Challenge Type Toggle */}
                {teams.length > 0 && (
                  <div className="mb-4">
                    <div className="flex gap-2 p-1 bg-bg-secondary rounded-lg">
                      <button
                        onClick={() => { setIsTeamChallenge(false); setSearchQuery(''); }}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          !isTeamChallenge 
                            ? 'bg-bg-primary text-text-primary shadow-sm' 
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        Singles
                      </button>
                      <button
                        onClick={() => { setIsTeamChallenge(true); setSearchQuery(''); }}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isTeamChallenge 
                            ? 'bg-bg-primary text-text-primary shadow-sm' 
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        Team
                      </button>
                    </div>
                    {isTeamChallenge && (
                      <p className="text-xs text-text-muted mt-2">
                        Challenge another team to a doubles match
                      </p>
                    )}
                  </div>
                )}

                {isTeamChallenge ? (
                  // Team Challenge: Show opponent teams to challenge
                  <>
                    {userTeams.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-text-muted mx-auto mb-4" />
                        <p className="text-text-secondary mb-4">You need to be part of a team to issue team challenges</p>
                        <Link href="/teams" className="text-accent hover:underline">
                          Create or join a team
                        </Link>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-text-secondary mb-2">Select opponent team:</p>
                        <input
                          type="text"
                          placeholder="Search teams..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-border bg-bg-secondary text-text-primary mb-4 focus:outline-none focus:border-accent"
                        />

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {filteredTeams.map((team: any) => {
                            // Check if any of the current user's teams can challenge this team
                            const canChallenge = userTeams.some((ut: any) => ut.id !== team.id);
                            return (
                              <div 
                                key={team.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary hover:bg-bg-secondary/80 transition-colors cursor-pointer"
                                onClick={() => {
                                  if (canChallenge) {
                                    setSelectedTeam(team);
                                  }
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                                    <Users className="h-4 w-4 text-accent" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-text-primary">{team.name || `Team ${team.player1?.name || 'Unknown'}`}</p>
                                    <p className="text-xs text-text-secondary">
                                      {team.player1?.name}{team.player2 ? ` & ${team.player2.name}` : ''} • {team.foreverElo} ELO
                                    </p>
                                  </div>
                                </div>
                                <Button size="sm" variant="ghost" disabled={!canChallenge}>
                                  Challenge
                                </Button>
                              </div>
                            );
                          })}
                          {filteredTeams.length === 0 && (
                            <p className="text-center text-text-secondary py-4">
                              {searchQuery ? 'No teams found' : 'No teams available'}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  // Singles Challenge: Show players to challenge
                  <>
                    <input
                      type="text"
                      placeholder="Search players..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-bg-secondary text-text-primary mb-4 focus:outline-none focus:border-accent"
                    />

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredUsers.map((user) => (
                        <div 
                          key={user.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary hover:bg-bg-secondary/80 transition-colors cursor-pointer"
                          onClick={() => setSelectedUserForChallenge(user)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={user.image}
                              alt={user.name}
                              fallback={user.name?.charAt(0) || '?'}
                              size="sm"
                            />
                            <div>
                              <p className="font-medium text-text-primary">{user.name}</p>
                              <p className="text-xs text-text-secondary">{user.foreverElo} ELO</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost">
                            Select
                          </Button>
                        </div>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="text-center text-text-secondary py-4">
                          {searchQuery ? 'No players found' : 'No players available'}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Stakes step - for both singles and team challenges */}
                <div className="mb-4 p-4 bg-bg-secondary rounded-lg">
                  <p className="text-sm text-text-secondary mb-1">
                    {isTeamChallenge ? 'Team Challenge:' : 'Challenging:'}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {isTeamChallenge ? (
                      // Show opponent team
                      <>
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                          <Users className="h-4 w-4 text-accent" />
                        </div>
                        <span className="font-semibold">{selectedTeam?.name || `Team ${selectedTeam?.player1?.name || 'Unknown'}`}</span>
                        <span className="text-text-muted">via</span>
                        <Badge variant="outline" size="sm">
                          {userTeams.find((t: any) => t.id !== selectedTeam?.id)?.name || 'Your team'}
                        </Badge>
                      </>
                    ) : (
                      // Show opponent player
                      <>
                        <Avatar
                          src={selectedUserForChallenge.image}
                          alt={selectedUserForChallenge.name}
                          fallback={selectedUserForChallenge.name?.charAt(0) || '?'}
                          size="sm"
                        />
                        <span className="font-semibold">{selectedUserForChallenge.name}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Select your stake (both sides put up this amount):
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[5, 10, 15, 20, 25].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setStakeAmount(amount)}
                        className={`p-3 rounded-lg border-2 font-semibold transition-colors ${
                          stakeAmount === amount 
                            ? 'border-accent bg-accent/10 text-accent' 
                            : 'border-border bg-bg-secondary text-text-secondary hover:border-accent/50'
                        }`}
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-text-secondary mt-2">
                    Winner takes all! You risk {stakeAmount} ELO, but can win {stakeAmount * 2} ELO.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (isTeamChallenge) {
                        setSelectedTeam(null);
                      } else {
                        setSelectedUserForChallenge(null);
                      }
                    }}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      if (isTeamChallenge) {
                        // For team challenges, find the challenging team (not the opponent)
                        const challengingTeam = userTeams.find((t: any) => t.id !== selectedTeam?.id);
                        if (challengingTeam) {
                          handleChallenge(selectedTeam!.id, stakeAmount, challengingTeam.id);
                        }
                      } else {
                        handleChallenge(selectedUserForChallenge.id, stakeAmount);
                      }
                    }}
                    className="flex-1"
                  >
                    {isTeamChallenge ? 'Team Challenge' : 'Challenge'} for {stakeAmount} ELO!
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
