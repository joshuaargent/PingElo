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
  Check
} from 'lucide-react';

type Tab = 'profile' | 'account' | 'notifications' | 'appearance';

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      redirect('/auth/signin');
    }
    if (session?.user?.name) {
      setName(session.user.name);
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
        body: JSON.stringify({ name }),
      });
      
      if (res.ok) {
        setSaveSuccess(true);
        await update({ name });
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
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
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        </div>

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
              { id: 'notifications', label: 'Notifications', icon: Bell },
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
                  src={session.user.image}
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
                    <Button 
                      onClick={handleSaveProfile} 
                      isLoading={isSaving}
                      disabled={isSaving || name === session.user.name}
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
                  <h3 className="font-medium text-text-primary mb-4">ELO Stats</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-bg-secondary rounded-xl text-center">
                      <p className="text-2xl font-bold text-text-primary">1,285</p>
                      <p className="text-sm text-text-secondary">Forever ELO</p>
                    </div>
                    <div className="p-4 bg-bg-secondary rounded-xl text-center">
                      <p className="text-2xl font-bold text-text-primary">1,250</p>
                      <p className="text-sm text-text-secondary">Season ELO</p>
                    </div>
                    <div className="p-4 bg-bg-secondary rounded-xl text-center">
                      <p className="text-2xl font-bold text-text-primary">45</p>
                      <p className="text-sm text-text-secondary">Matches</p>
                    </div>
                    <div className="p-4 bg-bg-secondary rounded-xl text-center">
                      <p className="text-2xl font-bold text-text-primary">71%</p>
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
                <h2 className="text-lg font-semibold text-text-primary mb-4">Danger Zone</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-xl">
                    <div>
                      <p className="font-medium text-text-primary">Delete Account</p>
                      <p className="text-sm text-text-secondary">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="danger" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Notification Preferences</h2>
              <p className="text-text-secondary mb-6">
                Choose how you want to be notified about activity.
              </p>
              <div className="space-y-4">
                {[
                  { label: 'Match reminders', desc: 'Get notified when it\'s time for a match' },
                  { label: 'Tournament updates', desc: 'Receive updates about tournaments you\'re in' },
                  { label: 'Leaderboard changes', desc: 'Know when your rank changes' },
                  { label: 'New players', desc: 'Get notified when new players join' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-bg-secondary rounded-xl">
                    <div>
                      <p className="font-medium text-text-primary">{item.label}</p>
                      <p className="text-sm text-text-secondary">{item.desc}</p>
                    </div>
                    <Badge variant="success">Enabled</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Appearance</h2>
              <p className="text-text-secondary mb-6">
                Customize how PingElo looks for you.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-xl">
                  <div>
                    <p className="font-medium text-text-primary">Theme</p>
                    <p className="text-sm text-text-secondary">Automatic (follows system)</p>
                  </div>
                  <Badge>Auto</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-xl">
                  <div>
                    <p className="font-medium text-text-primary">Accent Color</p>
                    <p className="text-sm text-text-secondary">Primary accent color</p>
                  </div>
                  <Badge>Blue</Badge>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
