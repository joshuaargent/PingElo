'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Trophy, TrendingUp, Star, Sparkles, Target, Flame, Crown } from 'lucide-react';

interface WeeklyStats {
  eloGained: number;
  wins: number;
  matchesPlayed: number;
  wasTopClimber: boolean;
  wasWinsLeader: boolean;
}

export default function WeeklyResetPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [status, setStatus] = useState<'loading' | 'summary' | 'error'>('loading');
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [hasMarkedSeen, setHasMarkedSeen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const fireConfetti = useCallback(() => {
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'];
    
    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors,
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  useEffect(() => {
    async function loadWeeklyData() {
      try {
        const userId = session?.user?.id;
        if (userId) {
          const weekRes = await fetch('/api/weekly-activity');
          if (weekRes.ok) {
            const weekData = await weekRes.json();
            if (weekData.currentWeek) {
              setWeeklyStats({
                eloGained: weekData.currentWeek.eloChange || 0,
                wins: weekData.currentWeek.wins || 0,
                matchesPlayed: weekData.currentWeek.matchesPlayed || 0,
                wasTopClimber: false,
                wasWinsLeader: false,
              });
            }
          }
        }
        
        const currentWeekKey = getWeekKey();
        const lastSeenWeek = localStorage.getItem('lastSeenWeek');
        
        if (lastSeenWeek === currentWeekKey) {
          setHasMarkedSeen(true);
        } else {
          setShowConfetti(true);
        }
        
        setStatus('summary');
      } catch (error) {
        console.error('Failed to load weekly data:', error);
        setStatus('error');
      }
    }

    if (session?.user) {
      loadWeeklyData();
    }
  }, [session]);

  useEffect(() => {
    if (status === 'summary' && showConfetti && !hasMarkedSeen) {
      setTimeout(() => {
        fireConfetti();
      }, 500);
    }
  }, [status, showConfetti, hasMarkedSeen, fireConfetti]);

  const handleContinue = () => {
    const currentWeekKey = getWeekKey();
    if (!hasMarkedSeen) {
      localStorage.setItem('lastSeenWeek', currentWeekKey);
      setHasMarkedSeen(true);
    }
    router.push('/dashboard');
  };

  function getWeekKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
    return `${year}-W${weekNumber}`;
  }

  const getHypeMessage = () => {
    if (!weeklyStats) return "Keep climbing!";
    if (weeklyStats.wasTopClimber) return "🏆 TOP CLIMBER!";
    if (weeklyStats.wasWinsLeader) return "⚡ Wins Champion!";
    if (weeklyStats.eloGained >= 100) return "🔥 Absolute Beast!";
    if (weeklyStats.eloGained >= 50) return "⚡ On Fire!";
    if (weeklyStats.eloGained >= 25) return "🚀 Climbing Fast!";
    if (weeklyStats.eloGained >= 0) return "💪 Steady Progress!";
    if (weeklyStats.matchesPlayed === 0) return "🌅 Fresh Week!";
    return "💪 Every Legend Starts Somewhere!";
  };

  if (status === 'loading') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-accent/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 bg-accent/10 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-accent animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-4">New Week!</h1>
          <p className="text-text-secondary mb-2">Loading your stats...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="max-w-md p-6 sm:p-8 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">Something went wrong</h1>
          <p className="text-text-secondary mb-6">We couldn't load the weekly info. Please try again.</p>
          <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-3xl mx-auto px-4">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full animate-bounce"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Flame className="h-12 w-12 text-white" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-2">New Week!</h1>
        <p className="text-xl text-accent font-semibold mb-2">{getHypeMessage()}</p>
        <p className="text-lg text-text-secondary mb-8">Climb your way to the top</p>

        {weeklyStats && (
          <Card className="p-6 sm:p-8 mb-6 text-left bg-gradient-to-br from-bg-primary to-bg-secondary">
            <div className="flex items-center gap-4 mb-6">
              <Avatar
                src={session?.user?.image || undefined}
                alt={session?.user?.name || 'User'}
                fallback={session?.user?.name?.charAt(0) || 'U'}
                size="lg"
              />
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  {session?.user?.name?.split(' ')[0]}'s Week
                </h2>
                <p className="text-text-secondary">Last Week Recap</p>
              </div>
              {(weeklyStats.wasTopClimber || weeklyStats.wasWinsLeader) && (
                <Badge variant="accent" className="ml-auto">
                  <Crown className="h-4 w-4 mr-1" /> Leader
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="p-4 bg-bg-secondary rounded-xl text-center">
                <TrendingUp className={`h-6 w-6 mx-auto mb-2 ${weeklyStats.eloGained >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <p className="text-xl sm:text-2xl font-bold text-text-primary">
                  {weeklyStats.eloGained >= 0 ? '+' : ''}{weeklyStats.eloGained}
                </p>
                <p className="text-sm text-text-secondary">ELO Gained</p>
              </div>
              <div className="p-4 bg-bg-secondary rounded-xl text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-xl sm:text-2xl font-bold text-text-primary">{weeklyStats.matchesPlayed}</p>
                <p className="text-sm text-text-secondary">Matches</p>
              </div>
              <div className="p-4 bg-bg-secondary rounded-xl text-center">
                <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-xl sm:text-2xl font-bold text-text-primary">{weeklyStats.wins}</p>
                <p className="text-sm text-text-secondary">Wins</p>
              </div>
            </div>

            {(weeklyStats.wasTopClimber || weeklyStats.wasWinsLeader) && (
              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border-2 border-yellow-500">
                <div className="flex items-center justify-center gap-3">
                  <Star className="h-8 w-8 text-yellow-500 animate-pulse" />
                  <span className="text-xl font-bold text-yellow-400">🏆 WEEKLY LEADER! 🏆</span>
                  <Star className="h-8 w-8 text-yellow-500 animate-pulse" />
                </div>
                <p className="text-center text-text-secondary mt-2">You dominated the competition this week!</p>
              </div>
            )}
          </Card>
        )}

        <Card className="p-6 mb-8 text-left">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            This Week&apos;s Goals
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Climb the Rankings</p>
                <p className="text-sm text-text-secondary">Gain ELO to climb the leaderboard</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-yellow-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Trophy className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Become Top Climber</p>
                <p className="text-sm text-text-secondary">Most ELO gained wins the week!</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Build Your Streak</p>
                <p className="text-sm text-text-secondary">Keep your daily streak alive for bonus ELO!</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center space-y-4">
          <Button 
            size="lg"
            onClick={() => {
              if (!weeklyStats?.wasTopClimber && !weeklyStats?.wasWinsLeader) {
                fireConfetti();
              }
              handleContinue();
            }}
            className="px-8"
          >
            Start Climbing!
          </Button>
          {hasMarkedSeen ? (
            <p className="text-text-muted text-sm">
              You&apos;ve already seen this week!{' '}
              <Link href="/dashboard" className="text-accent hover:underline">Go to Dashboard</Link>
            </p>
          ) : (
            <p className="text-text-muted text-sm">
              <button onClick={handleContinue} className="text-accent hover:underline">Dismiss</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
