'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trophy, Users, TrendingUp, Star, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

interface SeasonStats {
  totalMatches: number;
  totalPlayers: number;
  champion: {
    name: string;
    elo: number;
    gains: number;
  } | null;
  topGainer: {
    name: string;
    gains: number;
  } | null;
}

export default function SeasonResetPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'summary' | 'error'>('loading');
  const [previousStats, setPreviousStats] = useState<SeasonStats | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    async function performReset() {
      try {
        // Fetch previous season stats before reset
        const seasonRes = await fetch('/api/seasons/current');
        const seasonData = await seasonRes.json();
        
        // Get user stats for champion
        const usersRes = await fetch('/api/users?includeStats=true&sortBy=seasonElo&order=desc&limit=5');
        const usersData = await usersRes.json();
        
        if (usersData.users && usersData.users.length > 0) {
          const champion = usersData.users[0];
          setPreviousStats({
            totalMatches: 0, // Would need a separate query
            totalPlayers: usersData.users?.length || 0,
            champion: {
              name: champion.name,
              elo: champion.seasonElo,
              gains: champion.seasonElo - 1000,
            },
            topGainer: null,
          });
        }

        // Perform the reset
        const resetRes = await fetch('/api/seasons/reset', {
          method: 'POST',
        });

        if (resetRes.ok) {
          setStatus('summary');
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Season reset failed:', error);
        setStatus('error');
      }
    }

    performReset();
  }, []);

  useEffect(() => {
    if (status === 'summary' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'summary' && countdown === 0) {
      router.push('/dashboard');
    }
  }, [status, countdown, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          {/* Animated Loading */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-accent/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 bg-accent/10 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-accent animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-text-primary mb-4">
            New Season Starting!
          </h1>
          <p className="text-text-secondary mb-2">
            Preparing your fresh start...
          </p>
          <div className="flex items-center justify-center gap-2 text-accent">
            <div className="animate-bounce">✨</div>
            <span>Resetting ELO ratings</span>
            <div className="animate-bounce">✨</div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            Something went wrong
          </h1>
          <p className="text-text-secondary mb-6">
            We couldn't complete the season reset. Please try again.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-4">
        {/* Success Animation */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
          <div className="relative w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Season Reset Complete!
        </h1>
        <p className="text-text-secondary mb-8">
          Your new season awaits. Let's climb the leaderboard!
        </p>

        {/* Previous Season Summary */}
        {previousStats && previousStats.champion && (
          <Card className="p-6 mb-8 text-left">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h2 className="font-semibold text-text-primary">Previous Season Champion</h2>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-2xl">
                  👑
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{previousStats.champion.name}</p>
                  <p className="text-sm text-text-secondary">
                    Final ELO: {previousStats.champion.elo}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-500">+{previousStats.champion.gains}</p>
                <p className="text-sm text-text-muted">Season gains</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>+{Math.round(previousStats.champion.gains * 0.1)} bonus ELO added to forever rating!</span>
              </div>
            </div>
          </Card>
        )}

        {/* What's New */}
        <Card className="p-6 mb-8 text-left">
          <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Your New Season
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-accent">1</span>
              </div>
              <div>
                <p className="font-medium text-text-primary">Season ELO reset to 1000</p>
                <p className="text-sm text-text-secondary">Everyone starts fresh!</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-accent">2</span>
              </div>
              <div>
                <p className="font-medium text-text-primary">Compete for this month's crown</p>
                <p className="text-sm text-text-secondary">Win the season, earn forever ELO bonus</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-accent">3</span>
              </div>
              <div>
                <p className="font-medium text-text-primary">Your forever ELO stays</p>
                <p className="text-sm text-text-secondary">All-time progress is preserved</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Auto-redirect */}
        <div className="text-center">
          <p className="text-text-muted mb-4">
            Redirecting to dashboard in {countdown}...
          </p>
          <Button 
            onClick={() => router.push('/dashboard')}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Go to Dashboard Now
          </Button>
        </div>
      </div>
    </div>
  );
}
