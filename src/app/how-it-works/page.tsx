'use client';

import { PageHero } from '@/components/layout/PageHero';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { TrendingUp, Award, Trophy, Calendar, Users, Zap, Flame, Star, Swords, Activity, Target } from 'lucide-react';

// ============================================
// How It Works Page
// ============================================

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        title="How It Works"
        description="Everything you need to know about PingElo"
      />

      <div className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          {/* Quick Links */}
          <section className="mb-12">
            <div className="flex flex-wrap gap-3">
              <a href="#elo-system" className="px-4 py-2 bg-bg-secondary rounded-lg text-sm hover:bg-bg-secondary/80 transition-colors">
                ELO System
              </a>
              <a href="#seasons" className="px-4 py-2 bg-bg-secondary rounded-lg text-sm hover:bg-bg-secondary/80 transition-colors">
                Seasons
              </a>
              <a href="#streaks" className="px-4 py-2 bg-bg-secondary rounded-lg text-sm hover:bg-bg-secondary/80 transition-colors">
                Daily Streaks
              </a>
              <a href="#achievements" className="px-4 py-2 bg-bg-secondary rounded-lg text-sm hover:bg-bg-secondary/80 transition-colors">
                Achievements
              </a>
              <a href="#top-climber" className="px-4 py-2 bg-bg-secondary rounded-lg text-sm hover:bg-bg-secondary/80 transition-colors">
                Top Climber
              </a>
              <a href="#challenges" className="px-4 py-2 bg-bg-secondary rounded-lg text-sm hover:bg-bg-secondary/80 transition-colors">
                Challenges
              </a>
              <a href="#tournaments" className="px-4 py-2 bg-bg-secondary rounded-lg text-sm hover:bg-bg-secondary/80 transition-colors">
                Tournaments
              </a>
            </div>
          </section>

          {/* ELO System Section */}
          <section id="elo-system" className="mb-16 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6">The ELO Rating System</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">What is ELO?</h3>
                    <p className="text-text-secondary text-sm">
                      ELO is a rating system originally designed for chess that measures player skill levels.
                      After each match, winners gain ELO points and losers lose them. The amount depends on
                      how unexpected the result was.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Starting ELO</h3>
                    <p className="text-text-secondary text-sm">
                      Every new player starts at <strong>1000 ELO</strong>. From there, your rating grows
                      as you win matches and learn from losses. The system adapts to your experience level.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <h3 className="text-lg font-semibold mb-4">Dynamic K-Factor</h3>
            <p className="text-text-secondary mb-6">
              New players adjust quickly while veterans maintain stable ratings. The K-factor determines
              how much your ELO can change per match.
            </p>

            <div className="overflow-x-auto rounded-xl border border-border mb-8">
              <table className="w-full min-w-[400px]">
                <thead className="bg-bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Games Played</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">K-Factor</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 text-sm">0-10 games</td>
                    <td className="px-4 py-3">
                      <Badge variant="primary" size="sm">64</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">Rapid adjustment for new players</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm">11-30 games</td>
                    <td className="px-4 py-3">
                      <Badge variant="default" size="sm">48</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">Still adjusting quickly</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm">31-100 games</td>
                    <td className="px-4 py-3">
                      <Badge variant="default" size="sm">32</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">Established, stable players</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm">100+ games</td>
                    <td className="px-4 py-3">
                      <Badge variant="default" size="sm">24</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">Veterans - slow to change</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold mb-4">Score Margin Bonus</h3>
            <p className="text-text-secondary mb-6">
              In all matches (casual and tournament), dominating wins earn a bonus multiplier. 
              This rewards playing well, not just winning. Both winner AND loser are affected— 
              big wins mean bigger changes for everyone!
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-accent mb-2">1.0x</div>
                <p className="text-sm text-text-secondary mb-2">Close games (1-4 points)</p>
                <p className="text-xs text-text-secondary">Standard ELO change</p>
              </Card>

              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-accent mb-2">1.25x</div>
                <p className="text-sm text-text-secondary mb-2">Clear wins (5-9 points)</p>
                <p className="text-xs text-text-secondary">25% bonus to ELO change</p>
              </Card>

              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-accent mb-2">1.5x</div>
                <p className="text-sm text-text-secondary mb-2">Dominance (10+ points)</p>
                <p className="text-xs text-text-secondary">50% bonus to ELO change</p>
              </Card>
            </div>

            <Card className="p-4 mt-4 bg-accent/10">
              <p className="text-sm text-text-secondary">
                <strong>Example:</strong> K=32, blowout win (10+ pts): Winner gets +24 ELO, Loser loses 24 ELO
              </p>
            </Card>
          </section>

          {/* Seasons Section */}
          <section id="seasons" className="mb-16 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6">Monthly Seasons</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-6 w-6 text-accent" />
                  <h3 className="text-lg font-semibold">Fresh Starts</h3>
                </div>
                <p className="text-text-secondary text-sm">
                  Every month starts a new season with everyone at 1000 ELO. This gives newcomers
                  a fair chance and lets everyone compete for the top spot on the season leaderboard.
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="h-6 w-6 text-accent" />
                  <h3 className="text-lg font-semibold">Season Champion Bonus</h3>
                </div>
                <p className="text-text-secondary text-sm">
                  The season winner receives a <strong>10% bonus</strong> of their season gains
                  added to their forever ELO. This applies to singles, doubles (individual), AND 
                  teams! Season championships matter for everyone.
                </p>
              </Card>
            </div>

            <Card className="p-4 bg-purple-500/10 border-purple-500/30">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-5 w-5 text-purple-500" />
                <h4 className="font-semibold">Season Countdown</h4>
              </div>
              <p className="text-sm text-text-secondary">
                Track the time remaining in the current season with the countdown widget on your dashboard.
                When the countdown reaches zero, a new season begins and all season ELOs reset to 1000!
              </p>
            </Card>
          </section>

          {/* Daily Streak Section */}
          <section id="streaks" className="mb-16 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6">Daily Streaks</h2>
            
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Flame className="h-6 w-6 text-orange-500" />
                <h3 className="text-lg font-semibold">Keep Your Streak Alive!</h3>
              </div>
              <p className="text-text-secondary text-sm mb-4">
                Play at least one match per day to maintain your streak. Streaks unlock bonus ELO rewards!
              </p>
              
              <div className="grid md:grid-cols-4 gap-4">
                <Card className="p-4 text-center bg-orange-500/10">
                  <div className="text-2xl font-bold text-orange-500 mb-1">3-6 days</div>
                  <div className="text-sm text-text-secondary">+1 ELO/match</div>
                  <div className="text-xs text-text-muted mt-1">(max +5/day)</div>
                </Card>
                <Card className="p-4 text-center bg-orange-500/10">
                  <div className="text-2xl font-bold text-orange-500 mb-1">7-13 days</div>
                  <div className="text-sm text-text-secondary">+2 ELO/match</div>
                  <div className="text-xs text-text-muted mt-1">(max +10/day)</div>
                </Card>
                <Card className="p-4 text-center bg-orange-500/10">
                  <div className="text-2xl font-bold text-orange-500 mb-1">14-29 days</div>
                  <div className="text-sm text-text-secondary">+3 ELO/match</div>
                  <div className="text-xs text-text-muted mt-1">(max +15/day)</div>
                </Card>
                <Card className="p-4 text-center bg-orange-500/10">
                  <div className="text-2xl font-bold text-orange-500 mb-1">30+ days</div>
                  <div className="text-sm text-text-secondary">+5 ELO/match</div>
                  <div className="text-xs text-text-muted mt-1">(max +25/day)</div>
                </Card>
              </div>

              <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg">
                <p className="text-sm text-text-secondary">
                  <strong>Note:</strong> Missing up to 2 days won't break your streak thanks to the grace period! Play again within 3 days and your streak continues.
                </p>
              </div>
            </Card>
          </section>

          {/* Achievements Section */}
          <section id="achievements" className="mb-16 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6">Achievements</h2>
            
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Star className="h-6 w-6 text-yellow-500" />
                <h3 className="text-lg font-semibold">Unlock Achievements</h3>
              </div>
              <p className="text-text-secondary text-sm mb-4">
                Earn achievements by hitting milestones in your ping pong journey. They&apos;re tracked automatically
                as you play matches!
              </p>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="success" size="sm">Match</Badge>
                </h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>⚔️ First Blood - Win your first match</li>
                  <li>👋 Getting Started - Play 10 matches</li>
                  <li>💯 Century Club - Play 100 matches</li>
                  <li>🎯 Five Hundred - Play 500 matches</li>
                </ul>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="warning" size="sm">Win</Badge>
                </h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>🏆 Centurion - Get 100 wins</li>
                  <li>⚡ Half K Hero - Get 500 wins</li>
                  <li>👑 Champion - Get 1,000 wins</li>
                  <li>🤝 Doubles Rookie - Complete first doubles match</li>
                </ul>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="performance" size="sm">Streak</Badge>
                </h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>🔥 Hot Streak - 7-day streak</li>
                  <li>💥 Blazing - 30-day streak</li>
                  <li>⚡ Unstoppable - 90-day streak</li>
                  <li>🌟 Legendary Streak - 365-day streak</li>
                </ul>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="code" size="sm">ELO</Badge>
                </h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>⭐ Rising Star - Reach Gold tier (1300 ELO)</li>
                  <li>💎 Elite Player - Reach Platinum tier (1500 ELO)</li>
                  <li>⚡ Master - Reach Master tier (1900 ELO)</li>
                  <li>👊 Goliath Killer - Beat 200+ ELO above you</li>
                </ul>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="psychology" size="sm">Season</Badge>
                </h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>🏆 Season Champion - Win a singles season</li>
                  <li>👑 Season King - Win 3 seasons</li>
                  <li>👥 Team Player - Complete first team season</li>
                  <li>🏅 Team Champion - Win a team season</li>
                </ul>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="primary" size="sm">Special</Badge>
                </h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>💪 Comeback Kid - Win after being down 5+ points</li>
                  <li>🔱 Dominant - Win 11-0 (shutout)</li>
                  <li>⚡ Quick Draw - Win in under 2 minutes</li>
                </ul>
              </Card>
            </div>

            <p className="text-sm text-text-secondary">
              View your achievements on your <Link href="/dashboard" className="text-accent hover:underline">dashboard</Link> or <Link href="/profile" className="text-accent hover:underline">profile page</Link>!
            </p>
          </section>

          {/* Top Climber Section */}
          <section id="top-climber" className="mb-16 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6">Top Climber</h2>
            
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-6 w-6 text-green-500" />
                <h3 className="text-lg font-semibold">Weekly Bonus Competition</h3>
              </div>
              <p className="text-text-secondary text-sm mb-4">
                Compete for the Top Climber title in <strong>three separate categories</strong> every week! 
                The week runs from Monday to Sunday. Each category awards <strong>10% of your weekly gains</strong> as bonus forever ELO!
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4 bg-green-500/10 border-green-500/30">
                  <div className="text-2xl mb-2">🎯</div>
                  <h4 className="font-semibold mb-2">Singles</h4>
                  <p className="text-sm text-text-secondary">
                    Top singles climber wins <strong>10%</strong> of their weekly singles gains!
                  </p>
                  <p className="text-xs text-text-muted mt-2">Example: 100 ELO gained → 10 bonus ELO</p>
                </Card>
                <Card className="p-4 bg-blue-500/10 border-blue-500/30">
                  <div className="text-2xl mb-2">🎾</div>
                  <h4 className="font-semibold mb-2">Doubles</h4>
                  <p className="text-sm text-text-secondary">
                    Top doubles player wins <strong>10%</strong> of their weekly doubles gains!
                  </p>
                  <p className="text-xs text-text-muted mt-2">Example: 80 ELO gained → 8 bonus ELO</p>
                </Card>
                <Card className="p-4 bg-purple-500/10 border-purple-500/30">
                  <div className="text-2xl mb-2">👥</div>
                  <h4 className="font-semibold mb-2">Teams</h4>
                  <p className="text-sm text-text-secondary">
                    Top team player wins <strong>10%</strong> of their weekly team gains!
                  </p>
                  <p className="text-xs text-text-muted mt-2">Example: 120 ELO gained → 12 bonus ELO</p>
                </Card>
              </div>

              <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <h4 className="font-semibold text-yellow-400">Season Reset Bonus</h4>
                </div>
                <p className="text-sm text-text-secondary">
                  Season champions earn a <strong>permanent 10% bonus</strong> of their season ELO to their forever ELO! 
                  This is separate from weekly bonuses - you can win both!
                </p>
              </div>

              <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                <p className="text-sm text-text-secondary">
                  <strong>No ELO resets!</strong> Weekly stats are for rewards only - they don&apos;t reset your ELO. 
                  Your forever ELO keeps growing! Weekly tracking resets when a new season begins.
                </p>
              </div>
            </Card>

            <Card className="p-4 bg-accent/10">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="h-5 w-5 text-accent" />
                <h4 className="font-semibold">How It Works</h4>
              </div>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• Each week starts on Monday at midnight</li>
                <li>• Your ELO gains are tracked separately for singles, doubles, and teams</li>
                <li>• Only qualified players (3+ matches in a category) qualify for that category&apos;s bonus</li>
                <li>• Each category&apos;s leader gets 10% of their weekly gains as bonus forever ELO</li>
                <li>• Check the <Link href="/leaderboard" className="text-accent hover:underline">Leaderboard</Link> for weekly stats</li>
                <li>• <strong>Can you win multiple categories?</strong> Yes! Play in all three modes for triple the chances!</li>
              </ul>
            </Card>
          </section>

          {/* Match Reactions Section */}
          <section id="reactions" className="mb-16 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6">Match Reactions</h2>
            
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="h-6 w-6 text-blue-500" />
                <h3 className="text-lg font-semibold">Celebrate Great Matches</h3>
              </div>
              <p className="text-text-secondary text-sm mb-4">
                React to matches with emoji to celebrate awesome plays, acknowledge tough losses,
                or just show some love for a good game!
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">🔥 Fire</span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">💪 Strong</span>
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">👏 Clap</span>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">😮 Wow</span>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">😂 Funny</span>
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">🏆 Champion</span>
              </div>

              <p className="text-sm text-text-secondary">
                Click the reaction button on any match card to add your reaction!
              </p>
            </Card>
          </section>

          {/* Activity Feed Section */}
          <section id="activity" className="mb-16 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6">Activity Feed</h2>
            
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="h-6 w-6 text-purple-500" />
                <h3 className="text-lg font-semibold">Stay Updated</h3>
              </div>
              <p className="text-text-secondary text-sm mb-4">
                The activity feed shows recent achievements, match highlights, and community milestones.
                It&apos;s a great way to see what&apos;s happening in the PingElo community!
              </p>

              <div className="space-y-2 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">●</span>
                  <span><strong>Match</strong> - Recent match results</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">●</span>
                  <span><strong>Achievement</strong> - Players unlocking achievements</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-500">●</span>
                  <span><strong>Streak</strong> - Streak milestones</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-500">●</span>
                  <span><strong>Season</strong> - Season milestones</span>
                </div>
              </div>
            </Card>
          </section>

          {/* Challenges Section */}
          <section id="challenges" className="mb-16 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6">Player Challenges</h2>
            
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Swords className="h-6 w-6 text-red-500" />
                <h3 className="text-lg font-semibold">Challenge Other Players</h3>
              </div>
              <p className="text-text-secondary text-sm mb-4">
                Want to prove you&apos;re better than a friend? Issue a challenge! Challenges let you
                set up official matchups with ELO stakes. Put your ELO on the line!
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
                  <h4 className="font-semibold mb-2">How to Challenge</h4>
                  <ol className="text-sm text-text-secondary space-y-1 list-decimal list-inside">
                    <li>Go to the <Link href="/challenges" className="text-accent hover:underline">Challenges page</Link></li>
                    <li>Click &quot;New Challenge&quot;</li>
                    <li>Select a player to challenge</li>
                    <li>Choose your stake (5-25 ELO)</li>
                    <li>Wait for them to accept & match</li>
                  </ol>
                </Card>
                <Card className="p-4 bg-green-500/10 border-green-500/30">
                  <h4 className="font-semibold mb-2">Challenge Status</h4>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>🟡 <strong>Pending</strong> - Waiting for response</li>
                    <li>🟢 <strong>Accepted</strong> - Ready to play!</li>
                    <li>🔴 <strong>Declined</strong> - Challenge rejected</li>
                    <li>⚪ <strong>Expired</strong> - Too much time passed</li>
                    <li>🔵 <strong>Completed</strong> - Winner decided</li>
                  </ul>
                </Card>
              </div>

              {/* Stakes Section */}
              <Card className="p-4 bg-red-500/10 border-red-500/30 mb-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  How Stakes Work
                </h4>
                <p className="text-sm text-text-secondary mb-3">
                  When you challenge someone, both players put up ELO stakes:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                  {[5, 10, 15, 20, 25].map((stake) => (
                    <div key={stake} className="p-2 bg-bg-secondary rounded-lg text-center">
                      <p className="font-bold text-text-primary">{stake} ELO</p>
                    </div>
                  ))}
                </div>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• <strong>Challenger</strong> stakes first (deducted immediately)</li>
                  <li>• <strong>Challenged</strong> must match stake (deducted on accept)</li>
                  <li>• <strong>Winner takes all</strong> - gets both players&apos; stakes!</li>
                  <li>• <strong>Decline/Cancel</strong> - Challenger&apos;s stake refunded</li>
                </ul>
                <p className="text-sm text-accent mt-3">
                  <strong>Example:</strong> 10 ELO stake → Winner gets 20 ELO (their 10 back + opponent&apos;s 10)
                </p>
              </Card>

              <Card className="p-4 bg-accent/10">
                <p className="text-sm text-text-secondary">
                  <strong>Note:</strong> Challenges expire after 7 days if not accepted. Once accepted,
                  both players must have enough ELO to cover the stake.
                </p>
              </Card>
            </Card>
          </section>

          {/* Doubles & Teams Section */}
          <section id="doubles-teams" className="mb-16 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6">Doubles & Teams</h2>
            
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-6 w-6 text-accent" />
                <h3 className="text-lg font-semibold">Play with Friends</h3>
              </div>
              <p className="text-text-secondary text-sm mb-4">
                PingElo supports both singles and doubles matches. Doubles matches use a separate
                ELO rating (Doubles Forever ELO) that tracks your team performance.
              </p>

              <div className="p-3 bg-bg-secondary rounded-lg mb-4">
                <p className="text-sm text-text-secondary">
                  <strong>Important:</strong> Your <strong>individual ELO changes</strong> use YOUR K-factor 
                  (based on your personal doubles games), while your <strong>TEAM&apos;S ELO changes</strong> 
                  use your TEAM&apos;S K-factor.
                </p>
              </div>
              <ul className="mt-4 list-disc list-inside text-sm text-text-secondary space-y-1">
                <li>Teams persist across seasons</li>
                <li>Teams become inactive at season end but can be reactivated</li>
                <li>If you haven&apos;t played any matches yet, you can delete the team</li>
                <li>Teams that have played are preserved in history (can&apos;t be deleted)</li>
                <li>Your team&apos;s ELO is yours to fight for!</li>
                <li>Visit the <Link href="/teams" className="text-accent hover:underline">Teams page</Link> to manage</li>
              </ul>
            </Card>

            <h3 className="text-lg font-semibold mb-4">Tournaments vs Casual Games</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <Card className="p-4 bg-green-500/10 border-green-500/30">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-green-500 text-xl">✓</span> Casual Games (Pickup)
                </h3>
                <p className="text-sm text-text-secondary">
                  For regular games, pick any 4 players for ad-hoc matches. No team registration needed. 
                  Great for spontaneous games!
                </p>
              </Card>

              <Card className="p-4 bg-orange-500/10 border-orange-500/30">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-orange-500 text-xl">🏆</span> Tournaments (Teams Only)
                </h3>
                <p className="text-sm text-text-secondary">
                  Doubles tournaments require registered teams from the current season. 
                  This ensures fair competition and team accountability.
                </p>
              </Card>
            </div>

            <Card className="p-4 bg-bg-secondary">
              <p className="text-sm text-text-secondary">
                <strong>How it works:</strong> You create a team → Someone else creates a team with you → 
                Both teams exist! But you can&apos;t create a third team, and the same partnership 
                can&apos;t exist twice in one season.
              </p>
            </Card>
          </section>

          {/* Tournaments Section */}
          <section id="tournaments" className="mb-16 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6">Tournaments</h2>
            
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="h-6 w-6 text-accent" />
                <h3 className="text-lg font-semibold">Tournament Formats</h3>
              </div>
              <p className="text-text-secondary text-sm mb-4">
                PingElo supports multiple tournament formats to suit different play styles:
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <Card className="p-4 bg-accent/5">
                  <h4 className="font-semibold mb-1">🏆 Single Elimination</h4>
                  <p className="text-xs text-text-secondary">Lose once and you're out. Best for quick tournaments.</p>
                </Card>
                <Card className="p-4 bg-accent/5">
                  <h4 className="font-semibold mb-1">🔄 Double Elimination</h4>
                  <p className="text-xs text-text-secondary">Get a second chance! Losers move to the loser bracket.</p>
                </Card>
                <Card className="p-4 bg-accent/5">
                  <h4 className="font-semibold mb-1">🔢 Round Robin</h4>
                  <p className="text-xs text-text-secondary">Everyone plays everyone. Fairest format!</p>
                </Card>
                <Card className="p-4 bg-accent/5">
                  <h4 className="font-semibold mb-1">📊 Swiss System</h4>
                  <p className="text-xs text-text-secondary">No elimination! Standings-based pairings over multiple rounds.</p>
                </Card>
              </div>
            </Card>

            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="h-6 w-6 text-accent" />
                <h3 className="text-lg font-semibold">Entry Fees & Prize Pool</h3>
              </div>
              <p className="text-text-secondary text-sm mb-4">
                Tournaments use a tiered entry system. The platform adds <strong>50 ELO</strong> to 
                each tournament prize pool. <strong>Prize Pool = Entry Fees + 50 ELO</strong>
              </p>

              <div className="overflow-hidden rounded-lg border border-border mb-4">
                <table className="w-full">
                  <thead className="bg-bg-secondary">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-text-secondary">Your ELO</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-text-secondary">Entry Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-4 py-2 text-sm">Below 800</td>
                      <td className="px-4 py-2 text-sm text-green-600 font-medium">Free!</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm">800-999</td>
                      <td className="px-4 py-2 text-sm">10 ELO</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm">1000-1199</td>
                      <td className="px-4 py-2 text-sm">20 ELO</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm">1200+</td>
                      <td className="px-4 py-2 text-sm">50 ELO</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-accent/10 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Doubles Entry Fee (Average Method)</h4>
                <p className="text-xs text-text-secondary">
                  In doubles, <strong>both players pay the same fee</strong> based on team average ELO: 
                  <br/>(Player1 ELO + Player2 ELO) / 2 = Team Average → Each pays that fee
                </p>
                <p className="text-xs text-text-secondary mt-2">
                  <strong>Examples:</strong> 1200+800=1000avg→20+20=40 total | 750+1200=975avg→10+10=20
                </p>
              </div>
            </Card>

            <h3 className="text-lg font-semibold mb-4">Prize Distribution</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-yellow-500 mb-1">1st</div>
                <p className="text-xl sm:text-2xl font-bold text-text-primary">50%</p>
                <p className="text-xs text-text-secondary">of prize pool</p>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-400 mb-1">2nd</div>
                <p className="text-xl sm:text-2xl font-bold text-text-primary">35%</p>
                <p className="text-xs text-text-secondary">of prize pool</p>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-orange-400 mb-1">3rd</div>
                <p className="text-xl sm:text-2xl font-bold text-text-primary">15%</p>
                <p className="text-xs text-text-secondary">of prize pool</p>
              </Card>
            </div>

            <Card className="p-4 mt-4 bg-accent/10">
              <h4 className="font-semibold text-sm mb-2">Doubles Prize Distribution</h4>
              <p className="text-xs text-text-secondary">
                When a doubles team places, <strong>players</strong> get individual rewards to their 
                <strong> doublesForeverElo</strong>, and the <strong>TEAM</strong> gets the total:
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div><strong>1st:</strong> Each +25%, Team +50%</div>
                <div><strong>2nd:</strong> Each +17.5%, Team +35%</div>
                <div><strong>3rd:</strong> Each +7.5%, Team +15%</div>
              </div>
              <p className="text-xs text-text-secondary mt-2">
                <strong>Example:</strong> 1st place = 250 ELO → Each player gets 125, Team gets 250
              </p>
            </Card>
          </section>

          {/* Fair Play Section */}
          <section id="fair-play" className="mb-16 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6">Fair Play</h2>
            
            <Card className="p-6 bg-accent/5 border-accent/20">
              <p className="text-text-secondary text-sm mb-4">
                PingElo relies on honest match reporting. When logging a match:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary">
                <li>Report the actual final score, not the starting scores</li>
                <li>Both players should agree on the result before logging</li>
                <li>Scores must be between 3 and 21 points</li>
                <li>The winner must have at least 11 points and won by 2</li>
              </ul>
              <p className="mt-4 text-sm text-text-secondary">
                Admins can review and adjust matches if needed.
              </p>
            </Card>
          </section>

          {/* Getting Started Section */}
          <section id="getting-started" className="scroll-mt-20">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6">Getting Started</h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">1️⃣</span>
                </div>
                <h3 className="font-semibold mb-2">Sign Up</h3>
                <p className="text-sm text-text-secondary">
                  Create an account with Google or email and start at 1000 ELO
                </p>
              </Card>
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">2️⃣</span>
                </div>
                <h3 className="font-semibold mb-2">Log Matches</h3>
                <p className="text-sm text-text-secondary">
                  Record your games with final scores and watch your ELO change
                </p>
              </Card>
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">3️⃣</span>
                </div>
                <h3 className="font-semibold mb-2">Climb Rankings</h3>
                <p className="text-sm text-text-secondary">
                  Compete, earn achievements, and rise through the leaderboard!
                </p>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
