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
import { Trophy, TrendingUp, Star, CheckCircle, ArrowRight, Sparkles, Target, Flame, Zap, Crown, TrendingDown, Award, Users } from 'lucide-react';

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
  // New detailed stats
  biggestUpset?: { opponent: string; opponentElo: number; gained: number };
  longestStreak?: number;
  bestWinMargin?: number;
  totalPartnerWins?: number;
  favoritePartner?: { name: string; wins: number };
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
  const [hasMarkedSeen, setHasMarkedSeen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Fire confetti celebration
  const fireConfetti = useCallback(() => {
    const duration = 3000;
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
    
    // Big burst in center
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: colors,
      startVelocity: 45,
    });
  }, []);

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
          setHasMarkedSeen(true);
        } else {
          // First time seeing new season - show confetti!
          setShowConfetti(true);
        }
        
        setSeasonInfo({
          name: currentSeasonName,
          previousName: seasonData.season?.previousName || 'Previous Season',
        });
        
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

  // Fire confetti when page loads for new seasons
  useEffect(() => {
    if (status === 'summary' && showConfetti && !hasMarkedSeen) {
      setTimeout(() => {
        fireConfetti();
      }, 500);
    }
  }, [status, showConfetti, hasMarkedSeen, fireConfetti]);

  const handleContinue = () => {
    if (seasonInfo?.name && !hasMarkedSeen) {
      localStorage.setItem('lastSeenSeason', seasonInfo.name);
      setHasMarkedSeen(true);
    }
    router.push('/dashboard');
  };

  const handleDismiss = () => {
    if (seasonInfo?.name && !hasMarkedSeen) {
      localStorage.setItem('lastSeenSeason', seasonInfo.name);
      setHasMarkedSeen(true);
    }
  };

  // Get hype message based on performance
  const getHypeMessage = () => {
    if (!userStats) return "Time to make your mark!";
    if (userStats.isChampion) return "👑 You were UNSTOPPABLE!";
    if (userStats.seasonGains >= 200) return "🔥 Absolute LEGEND status!";
    if (userStats.seasonGains >= 100) return "⚡ On FIRE this season!";
    if (userStats.seasonGains >= 50) return "🚀 Climbing the ranks!";
    if (userStats.winRate >= 80) return "🏆 Dominant force!";
    if (userStats.winRate >= 60) return "💪 Solid performance!";
    if (userStats.seasonGains >= 0) return "🌟 Steady improvement!";
    if (userStats.seasonMatches === 0) return "🌅 Fresh start awaits!";
    return "💪 Every legend starts somewhere!";
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
        <Card className="max-w-md p-6 sm:p-8 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">
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
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-accent to-orange-500 rounded-full animate-bounce"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Trophy className="h-16 w-16 text-white" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-2">
          {seasonInfo?.name || 'New Season'}!
        </h1>
        <p className="text-xl text-accent font-semibold mb-2">
          {getHypeMessage()}
        </p>
        <p className="text-lg text-text-secondary mb-8">
          Your ping pong journey continues
        </p>

        {/* User's Season Stats */}
        {userStats && (
          <Card className="p-6 sm:p-8 mb-6 text-left bg-gradient-to-br from-bg-primary to-bg-secondary">
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
              {userStats.isChampion && (
                <Badge variant="accent" className="ml-auto">
                  <Crown className="h-4 w-4 mr-1" /> Champion
                </Badge>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 gap-4 mb-6">
              <div className="p-4 bg-bg-secondary rounded-xl text-center">
                <TrendingUp className={`h-6 w-6 mx-auto mb-2 ${userStats.seasonGains >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <p className="text-xl sm:text-2xl font-bold text-text-primary">
                  {userStats.seasonGains >= 0 ? '+' : ''}{userStats.seasonGains}
                </p>
                <p className="text-sm text-text-secondary">Season Gains</p>
              </div>
              <div className="p-4 bg-bg-secondary rounded-xl text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-xl sm:text-2xl font-bold text-text-primary">{userStats.seasonMatches}</p>
                <p className="text-sm text-text-secondary">Matches</p>
              </div>
              <div className="p-4 bg-bg-secondary rounded-xl text-center">
                <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-xl sm:text-2xl font-bold text-text-primary">{userStats.winRate}%</p>
                <p className="text-sm text-text-secondary">Win Rate</p>
              </div>
              <div className="p-4 bg-bg-secondary rounded-xl text-center">
                <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                <p className="text-xl sm:text-2xl font-bold text-text-primary">Top {100 - userStats.percentile}%</p>
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

            {/* Champion Celebration */}
            {userStats.isChampion && (
              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border-2 border-yellow-500">
                <div className="flex items-center justify-center gap-3">
                  <Star className="h-8 w-8 text-yellow-500 animate-pulse" />
                  <span className="text-xl font-bold text-yellow-400">
                    🏆 SEASON CHAMPION! +{userStats.championBonus} Bonus ELO! 🏆
                  </span>
                  <Star className="h-8 w-8 text-yellow-500 animate-pulse" />
                </div>
                <p className="text-center text-text-secondary mt-2">
                  You dominated the competition. This bonus is now permanent!
                </p>
              </div>
            )}

            {/* Milestone Badges */}
            {userStats.seasonMatches >= 20 && (
              <div className="mt-4 flex justify-center">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  <Award className="h-5 w-5 mr-2" /> Dedicated Player - {userStats.seasonMatches} matches!
                </Badge>
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
              <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Season ELO reset to 1000</p>
                <p className="text-sm text-text-secondary">Fresh start for everyone - compete for the crown!</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-yellow-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Trophy className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Compete for the crown</p>
                <p className="text-sm text-text-secondary">Season champion earns a permanent 10% bonus to forever ELO</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Your forever ELO is safe</p>
                <p className="text-sm text-text-secondary">All-time progress preserved forever</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Continue Button */}
        <div className="text-center space-y-4">
          <Button 
            size="lg"
            onClick={() => {
              if (!userStats?.isChampion) {
                fireConfetti();
              }
              handleContinue();
            }}
            rightIcon={<ArrowRight className="h-5 w-5" />}
            className="px-8"
          >
            Start the Season!
          </Button>
          {hasMarkedSeen ? (
            <p className="text-text-muted text-sm">
              You've already seen this season!{' '}
              <Link href="/dashboard" className="text-accent hover:underline">
                Go to Dashboard
              </Link>
            </p>
          ) : (
            <p className="text-text-muted text-sm">
              Take your time to admire your glory!{' '}
              <button onClick={handleDismiss} className="text-accent hover:underline">
                Dismiss
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
