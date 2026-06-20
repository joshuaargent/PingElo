'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Trash2, 
  Save,
  ArrowLeft,
  Check,
  Sun,
  Moon,
  Monitor,
  Image
} from 'lucide-react';

type Tab = 'profile' | 'account' | 'notifications' | 'appearance';
type Theme = 'light' | 'dark' | 'system';

interface UserStats {
  foreverElo: number;
  seasonElo: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  image: string | null;
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [theme, setTheme] = useState<Theme>('system');
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      redirect('/auth/signin');
    }
    if (session?.user?.name) {
      setName(session.user.name);
    }
    
    // Fetch user stats including image
    async function fetchStats() {
      if (!session?.user?.id) return;
      try {
        const res = await fetch(`/api/users/${session.user.id}`);
        if (res.ok) {
          const data = await res.json();
          setUserStats(data.user);
          setAvatarUrl(data.user.image || '');
        }
        
        // Check if user has Google account
        const accountsRes = await fetch(`/api/users/${session.user.id}/accounts`);
        if (accountsRes.ok) {
          const accountsData = await accountsRes.json();
          const hasGoogle = accountsData.accounts?.some((a: any) => a.provider === 'google');
          setIsGoogleUser(hasGoogle);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    }
    
    fetchStats();
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [session, status]);

  const handleSaveProfile = async () => {
    if (!session?.user) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image: avatarUrl }),
      });
      
      if (res.ok) {
        setSaveSuccess(true);
        await update({ name, image: avatarUrl || undefined });
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) return;
    
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const res = await fetch('/api/users/self/delete', {
        method: 'DELETE',
      });
      
      if (res.ok) {
        // Sign out and redirect
        window.location.href = '/';
      } else {
        alert('Failed to delete account. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <h1 className="text-text-primary text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Settings
            </h1>
            <p className="text-text-secondary mx-auto mt-4 max-w-2xl text-lg">
              Manage your account and preferences
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'account', label: 'Account', icon: Shield },
              { id: 'appearance', label: 'Appearance', icon: Palette },
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

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-6">Profile Information</h2>
              
              <div className="flex items-center gap-6 mb-8">
                <Avatar
                  src={avatarUrl || session.user.image || undefined}
                  alt={session.user.name || 'User'}
                  fallback={session.user.name?.charAt(0) || 'U'}
                  size="xl"
                />
                <div>
                  <h3 className="font-medium text-text-primary">{session.user.name}</h3>
                  <p className="text-sm text-text-secondary">{session.user.email}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Display Name
                  </label>
                  <div className="flex gap-4">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Avatar URL {isGoogleUser && <span className="text-text-muted">(Using Google profile)</span>}
                  </label>
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <Input
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://example.com/your-avatar.jpg"
                        disabled={isGoogleUser}
                        className="w-full"
                      />
                      <p className="text-xs text-text-muted mt-1">
                        {isGoogleUser 
                          ? "Your avatar is managed by Google sign-in" 
                          : "Enter a URL to an image (jpg, png, gif). Leave empty to use initials."}
                      </p>
                    </div>
                    <Button 
                      onClick={handleSaveProfile} 
                      isLoading={isSaving}
                      disabled={isSaving || (name === session.user.name && avatarUrl === (userStats?.image || ''))}
                    >
                      {saveSuccess ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <h3 className="font-medium text-text-primary mb-4">Your Stats</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-bg-secondary rounded-xl text-center">
                      <p className="text-2xl font-bold text-text-primary">{userStats?.foreverElo ?? '—'}</p>
                      <p className="text-sm text-text-secondary">Forever ELO</p>
                    </div>
                    <div className="p-4 bg-bg-secondary rounded-xl text-center">
                      <p className="text-2xl font-bold text-text-primary">{userStats?.seasonElo ?? '—'}</p>
                      <p className="text-sm text-text-secondary">Season ELO</p>
                    </div>
                    <div className="p-4 bg-bg-secondary rounded-xl text-center">
                      <p className="text-2xl font-bold text-text-primary">{userStats?.matchesPlayed ?? 0}</p>
                      <p className="text-sm text-text-secondary">Matches</p>
                    </div>
                    <div className="p-4 bg-bg-secondary rounded-xl text-center">
                      <p className="text-2xl font-bold text-text-primary">{userStats?.winRate ?? 0}%</p>
                      <p className="text-sm text-text-secondary">Win Rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Account Type</h2>
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-xl">
                  <div>
                    <p className="font-medium text-text-primary">{(session.user as any).role || 'PLAYER'}</p>
                    <p className="text-sm text-text-secondary">Your account role</p>
                  </div>
                  <Badge variant={((session.user as any).role === 'ADMIN') ? 'primary' : 'outline'}>
                    {(session.user as any).role || 'PLAYER'}
                  </Badge>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Connected Accounts</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">Google</p>
                        <p className="text-sm text-text-secondary">Connected</p>
                      </div>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-red-500/20">
                <h2 className="text-lg font-semibold text-red-500 mb-4">Danger Zone</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-xl">
                    <div>
                      <p className="font-medium text-text-primary">Delete Account</p>
                      <p className="text-sm text-text-secondary">Permanently delete your account and all data</p>
                    </div>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={handleDeleteAccount}
                      isLoading={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Appearance</h2>
              <p className="text-text-secondary mb-6">
                Customize how PingElo looks for you.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    theme === 'light' 
                      ? 'border-accent bg-accent/5' 
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Sun className="h-8 w-8 text-yellow-500" />
                    <span className="text-sm font-medium text-text-primary">Light</span>
                  </div>
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    theme === 'dark' 
                      ? 'border-accent bg-accent/5' 
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Moon className="h-8 w-8 text-indigo-500" />
                    <span className="text-sm font-medium text-text-primary">Dark</span>
                  </div>
                </button>
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    theme === 'system' 
                      ? 'border-accent bg-accent/5' 
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Monitor className="h-8 w-8 text-text-secondary" />
                    <span className="text-sm font-medium text-text-primary">System</span>
                  </div>
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
