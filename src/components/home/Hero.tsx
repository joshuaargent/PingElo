import Link from 'next/link';
import { ArrowRight, Trophy, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ============================================
// Hero Component - PingElo Landing
// ============================================

export function Hero() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
      {/* Background Decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-light px-4 py-1.5 text-sm font-medium text-accent">
            <Trophy className="h-4 w-4" />
            <span>Track Your Ping Pong Journey</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-text-primary text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Climb the{' '}
            <span className="relative">
              <span className="text-accent">Leaderboard</span>
              <svg
                className="absolute -bottom-2 left-0 h-3 w-full text-accent/30"
                viewBox="0 0 200 12"
                fill="none"
              >
                <path
                  d="M2 10C50 4 150 4 198 10"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>{' '}
            with Every Match
          </h1>

          {/* Subheading */}
          <p className="text-text-secondary mx-auto mt-6 max-w-2xl text-lg md:text-xl">
            PingElo tracks your ping pong skills using the proven ELO rating system.
            Log matches, compete with friends, and watch your rating grow.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/matches/new">
              <Button size="lg" className="group">
                Log a Match
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="outline" size="lg">
                View Leaderboard
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 rounded-2xl bg-bg-card/50 p-8 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-accent flex items-center justify-center gap-2 text-3xl font-bold md:text-4xl">
                <TrendingUp className="h-8 w-8" />
                <span>ELO</span>
              </div>
              <p className="text-text-secondary mt-1 text-sm">Dynamic Ratings</p>
            </div>
            <div className="text-center">
              <div className="text-accent flex items-center justify-center gap-2 text-3xl font-bold md:text-4xl">
                <Trophy className="h-8 w-8" />
                <span>1v1</span>
              </div>
              <p className="text-text-secondary mt-1 text-sm">Singles & Doubles</p>
            </div>
            <div className="text-center">
              <div className="text-accent flex items-center justify-center gap-2 text-3xl font-bold md:text-4xl">
                <Users className="h-8 w-8" />
                <span>Season</span>
              </div>
              <p className="text-text-secondary mt-1 text-sm">Monthly Rankings</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
