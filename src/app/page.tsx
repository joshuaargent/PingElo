import Link from 'next/link';
import { Hero } from '@/components/home/Hero';
import { Leaderboard } from '@/components/elo/Leaderboard';
import { Button } from '@/components/ui/Button';
import { Trophy, TrendingUp, Users, Calendar, ArrowRight } from 'lucide-react';

// ============================================
// Homepage
// ============================================

export default function HomePage() {
  // Mock data for the preview - in production this would come from API
  const previewLeaderboard = [
    { rank: 1, userId: '1', name: 'Alex Chen', image: null, foreverElo: 1285, seasonElo: 1250, matchesPlayed: 45, wins: 32, losses: 13, winRate: 71.1, lastMatchDate: new Date(), isRusty: false, isActive: true },
    { rank: 2, userId: '2', name: 'Sarah Miller', image: null, foreverElo: 1240, seasonElo: 1220, matchesPlayed: 38, wins: 26, losses: 12, winRate: 68.4, lastMatchDate: new Date(), isRusty: false, isActive: true },
    { rank: 3, userId: '3', name: 'Mike Johnson', image: null, foreverElo: 1198, seasonElo: 1180, matchesPlayed: 52, wins: 34, losses: 18, winRate: 65.4, lastMatchDate: new Date(), isRusty: false, isActive: true },
    { rank: 4, userId: '4', name: 'Emma Wilson', image: null, foreverElo: 1156, seasonElo: 1140, matchesPlayed: 29, wins: 18, losses: 11, winRate: 62.1, lastMatchDate: new Date(), isRusty: false, isActive: true },
    { rank: 5, userId: '5', name: 'James Brown', image: null, foreverElo: 1105, seasonElo: 1090, matchesPlayed: 22, wins: 12, losses: 10, winRate: 54.5, lastMatchDate: new Date(), isRusty: false, isActive: true },
  ];

  return (
    <>
      <Hero />
      
      {/* Features Section */}
      <section className="py-20 bg-bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Track Your Progress
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              PingElo uses a proven ELO rating system to accurately measure your ping pong skills.
              Play matches, win games, and climb the leaderboard.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-bg-primary rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Dynamic ELO</h3>
              <p className="text-text-secondary text-sm">
                New players adjust quickly while veterans maintain stable ratings with our adaptive system.
              </p>
            </div>
            
            <div className="bg-bg-primary rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Tournaments</h3>
              <p className="text-text-secondary text-sm">
                Compete in paid-entry tournaments with prize pools. Everyone has a chance to win!
              </p>
            </div>
            
            <div className="bg-bg-primary rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Seasons</h3>
              <p className="text-text-secondary text-sm">
                Monthly seasons give you a fresh start. Season champions earn bonus ELO for their legacy!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-text-primary mb-2">
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
          
          <Leaderboard
            entries={previewLeaderboard}
            type="forever"
            showSeasonElo
          />
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="py-20 bg-bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              How It Works
            </h2>
            <p className="text-text-secondary mb-8">
              Getting started is easy. Log your matches, and watch your ELO grow.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div>
                <div className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  1
                </div>
                <h4 className="font-medium mb-1">Sign Up</h4>
                <p className="text-sm text-text-secondary">Create an account with Google or email</p>
              </div>
              <div>
                <div className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  2
                </div>
                <h4 className="font-medium mb-1">Log Matches</h4>
                <p className="text-sm text-text-secondary">Record your games with final scores</p>
              </div>
              <div>
                <div className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  3
                </div>
                <h4 className="font-medium mb-1">Climb Rankings</h4>
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
          <div className="bg-accent rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start?
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Join PingElo today and start tracking your ping pong journey.
              Whether you&apos;re a casual player or competitive, there&apos;s a spot for you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/leaderboard">
                <Button variant="secondary" size="lg" className="bg-white text-accent hover:bg-white/90">
                  View Leaderboard
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
