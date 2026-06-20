'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Trophy, TrendingUp, Star, CheckCircle, ArrowRight, Sparkles, Target, Flame, Zap } from 'lucide-react';

interface UserSeasonStats {
  name: string;
  image: string | null;
  previousSeasonElo: number;
  currentSeasonElo: number;
  seasonGains: number;
  seasonMatches: number;
  seasonWins: number;
  seasonLosses: number;
  winRate: number;
  percentile: number;
  isChampion: boolean;
  championBonus: number;
}

interface SeasonInfo {
  name: string;
  previousName: string;
}

export default function SeasonResetPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [status, setStatus] = useState<'loading' | 'summary' | 'error'>('loading');
  const [userStats, setUserStats] = useState<UserSeasonStats | null>(null);
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo | null>(null);
  const [countdown, setCountdown] = useState(8);
  const [hasSeen, setHasSeen] = useState(false);

  useEffect(() => {
    async function loadSeasonData() {
      try {
        // Get current season info
        const seasonRes = await fetch('/api/seasons/current');
        const seasonData = await seasonRes.json();
        
        // Get user's previous season stats
        const userId = session?.user?.id;
        if (userId) {
          const userRes = await fetch(`/api/users/${userId}/season-stats`);
          if (userRes.ok) {
            const userData = await userRes.json();
            setUserStats(userData);
          }
        }
        
        // Check if user has already seen this season
        const currentSeasonName = seasonData.season?.name || 'Current Season';
        const lastSeenSeason = localStorage.getItem('lastSeenSeason');
        
        if (lastSeenSeason === currentSeasonName) {
          // User has already seen this season, skip to dashboard
          router.push('/dashboard');
          return;
        }
        
        setSeasonInfo({
          name: currentSeasonName,
          previousName: seasonData.season?.previousName || 'Previous Season',
        });
        
        setHasSeen(false);
        setStatus('summary');
      } catch (error) {
        console.error('Failed to load season data:', error);
        setStatus('error');
      }
    }

    if (session?.user) {
      loadSeasonData();
    }
  }, [session, router]);

  useEffect(() => {
    if (status === 'summary' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'summary' && countdown === 0 && !hasSeen) {
      handleComplete();
    }
  }, [status, countdown, hasSeen]);

  const handleComplete = () => {
    // Mark season as seen
    if (seasonInfo?.name) {
      localStorage.setItem('lastSeenSeason', seasonInfo.name);
    }
    setHasSeen(true);
    router.push('/dashboard');
  };

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
            {seasonInfo?.name || 'New Season'}!
          </h1>
          <p className="text-text-secondary mb-2">
            Loading your stats...
          </p>
          <div className="flex items-center justify-center gap-2 text-accent">
            <div className="animate-bounce">✨</div>
            <span>Preparing your season</span>
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
            We couldn't load the season info. Please try again.
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
      <div className="text-center max-w-3xl mx-auto px-4">
        {/* Header Animation */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-accent to-orange-500 rounded-full animate-bounce"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Trophy className="h-16 w-16 text-white" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-2">
          {seasonInfo?.name || 'New Season'}!
        </h1>
        <p className="text-xl text-text-secondary mb-8">
          Your ping pong journey continues
        </p>

        {/* User's Season Stats */}
        {userStats && (
          <Card className="p-8 mb-8 text-left bg-gradient-to-br from-bg-primary to-bg-secondary">
            <div className="flex items-center gap-4 mb-6">
              <Avatar
                src={userStats.image || undefined}
                alt={userStats.name}
                fallback={userStats.name?.charAt(0) || 'U'}
                size="lg"
              />
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  {userStats.name.split(' ')[0]}'s Season
                </h2>
                <p className="text-text-secondary">
                  {seasonInfo?.previousName} Recap
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-bg-secondary rounded-xl text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-text-primary">
                  {userStats.seasonGains >= 0 ? '+' : ''}{userStats.seasonGains}
                </p>
                <p className="text-sm text-text-secondary">Season Gains</p>
              </div>
              <div className="p-4 bg-bg-secondary rounded-xl text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-text-primary">{userStats.seasonMatches}</p>
                <p className="text-sm text-text-secondary">Matches</p>
              </div>
              <div className="p-4 bg-bg-secondary rounded-xl text-center">
                <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold text-text-primary">{userStats.winRate}%</p>
                <p className="text-sm text-text-secondary">Win Rate</p>
              </div>
              <div className="p-4 bg-bg-secondary rounded-xl text-center">
                <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold text-text-primary">Top {100 - userStats.percentile}%</p>
                <p className="text-sm text-text-secondary">Percentile</p>
              </div>
            </div>

            {/* Wins/Losses */}
            <div className="flex items-center justify-center gap-8 py-4 border-t border-b border-border">
              <div>
                <span className="text-3xl font-bold text-green-500">{userStats.seasonWins}</span>
                <span className="text-text-secondary ml-2">Wins</span>
              </div>
              <div className="text-text-muted">vs</div>
              <div>
                <span className="text-3xl font-bold text-red-500">{userStats.seasonLosses}</span>
                <span className="text-text-secondary ml-2">Losses</span>
              </div>
            </div>

            {/* Champion Bonus */}
            {userStats.isChampion && (
              <div className="mt-6 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl border-2 border-yellow-500">
                <div className="flex items-center justify-center gap-3">
                  <Star className="h-6 w-6 text-yellow-500" />
                  <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                    Season Champion! +{userStats.championBonus} Bonus ELO!
                  </span>
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            )}
          </Card>
        )}

        {/* What's New in This Season */}
        <Card className="p-6 mb-8 text-left">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            What&apos;s New This Season
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-accent">1</span>
              </div>
              <div>
                <p className="font-medium text-text-primary">Season ELO reset to 1000</p>
                <p className="text-sm text-text-secondary">Fresh start for everyone!</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-accent">2</span>
              </div>
              <div>
                <p className="font-medium text-text-primary">Compete for the crown</p>
                <p className="text-sm text-text-secondary">Season champion earns bonus ELO</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-accent">3</span>
              </div>
              <div>
                <p className="font-medium text-text-primary">Your forever ELO is safe</p>
                <p className="text-sm text-text-secondary">All-time progress preserved</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Continue Button */}
        <div className="text-center">
          <Button 
            size="lg"
            onClick={handleComplete}
            rightIcon={<ArrowRight className="h-5 w-5" />}
            className="px-8"
          >
            Start the Season!
          </Button>
          <p className="text-text-muted mt-4 text-sm">
            Auto-redirecting in {countdown}...
          </p>
        </div>
      </div>
    </div>
  );
}
