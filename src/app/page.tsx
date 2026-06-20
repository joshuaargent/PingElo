import Link from 'next/link';
import { Hero } from '@/components/home/Hero';
import { Leaderboard } from '@/components/elo/Leaderboard';
import { Button } from '@/components/ui/Button';
import { Trophy, TrendingUp, Users, ArrowRight } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  foreverElo: number;
  seasonElo: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  lastMatchDate: Date | null;
  isRusty: boolean;
  isActive: boolean;
}

// ============================================
// Homepage - PingElo
// ============================================

export default async function HomePage() {
  // Fetch real leaderboard data
  let previewLeaderboard: LeaderboardEntry[] = [];
  
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/users?includeStats=true&sortBy=foreverElo&order=desc&limit=5`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      previewLeaderboard = (data.users || []).map((user: any, index: number) => ({
        rank: index + 1,
        userId: user.id,
        name: user.name,
        image: user.image,
        foreverElo: user.foreverElo,
        seasonElo: user.seasonElo,
        matchesPlayed: user.matchesPlayed,
        wins: user.wins || 0,
        losses: user.losses || 0,
        winRate: user.winRate || 0,
        lastMatchDate: user.lastMatchDate,
        isRusty: user.isRusty || false,
        isActive: user.isActive || false,
      }));
    }
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
  }

  return (
    <>
      <Hero />
      
      {/* Features Section */}
      <section className="bg-bg-secondary py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-text-primary">
              Track Your Progress
            </h2>
            <p className="mx-auto max-w-2xl text-text-secondary">
              PingElo uses a proven ELO rating system to accurately measure your ping pong skills.
              Play matches, win games, and climb the leaderboard.
            </p>
          </div>
          
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            <div className="rounded-xl bg-bg-primary p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Dynamic ELO</h3>
              <p className="text-sm text-text-secondary">
                New players adjust quickly while veterans maintain stable ratings with our adaptive system.
              </p>
            </div>
            
            <div className="rounded-xl bg-bg-primary p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <Trophy className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Tournaments</h3>
              <p className="text-sm text-text-secondary">
                Compete in paid-entry tournaments with prize pools. Everyone has a chance to win!
              </p>
            </div>
            
            <div className="rounded-xl bg-bg-primary p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Seasons</h3>
              <p className="text-sm text-text-secondary">
                Monthly seasons give you a fresh start. Season champions earn bonus ELO for their legacy!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="mb-2 text-3xl font-bold text-text-primary">
                Top Players
              </h2>
              <p className="text-text-secondary">
                The current ELO leaderboard
              </p>
            </div>
            <Link href="/leaderboard">
              <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View All
              </Button>
            </Link>
          </div>
          
          {previewLeaderboard.length > 0 ? (
            <Leaderboard
              entries={previewLeaderboard}
              type="forever"
              showSeasonElo
            />
          ) : (
            <div className="rounded-xl bg-bg-card p-12 text-center border border-border">
              <Trophy className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">No Players Yet</h3>
              <p className="text-text-secondary mb-4">Be the first to log a match!</p>
              <Link href="/matches/new">
                <Button>Log Your First Match</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="bg-bg-secondary py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-text-primary">
              How It Works
            </h2>
            <p className="mb-8 text-text-secondary">
              Getting started is easy. Log your matches, and watch your ELO grow.
            </p>
            
            <div className="mb-8 grid gap-6 md:grid-cols-3">
              <div>
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-white">
                  1
                </div>
                <h4 className="mb-1 font-medium">Sign Up</h4>
                <p className="text-sm text-text-secondary">Create an account with Google or email</p>
              </div>
              <div>
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-white">
                  2
                </div>
                <h4 className="mb-1 font-medium">Log Matches</h4>
                <p className="text-sm text-text-secondary">Record your games with final scores</p>
              </div>
              <div>
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-white">
                  3
                </div>
                <h4 className="mb-1 font-medium">Climb Rankings</h4>
                <p className="text-sm text-text-secondary">Watch your ELO change with each match</p>
              </div>
            </div>
            
            <Link href="/how-it-works">
              <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl bg-accent p-8 text-center text-white md:p-12">
            <h2 className="mb-4 text-3xl font-bold">
              Ready to Start?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-white/80">
              Join PingElo today and start tracking your ping pong journey.
              Whether you&apos;re a casual player or competitive, there&apos;s a spot for you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/matches/new">
                <Button size="lg" className="bg-white text-accent hover:bg-white/90">
                  Log Your First Match
                </Button>
              </Link>
              <Link href="/tournaments">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  Browse Tournaments
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
