import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TrendingUp, Award, Trophy, Calendar, Users, Zap } from 'lucide-react';

// ============================================
// How It Works Page
// ============================================

export default function HowItWorksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="How It Works"
        description="Understanding the PingElo rating system"
      />

      {/* ELO System Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-text-primary mb-6">The ELO Rating System</h2>
        
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
      </section>

      {/* Dynamic K-Factor Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Dynamic K-Factor</h2>
        <p className="text-text-secondary mb-6">
          New players adjust quickly while veterans maintain stable ratings. The K-factor determines
          how much your ELO can change per match.
        </p>

        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full">
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
      </section>

      {/* Score Margin Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Score Margin Bonus</h2>
        <p className="text-text-secondary mb-6">
          In casual matches, dominating wins earn a bonus multiplier. This rewards playing well,
          not just winning.
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
            <p className="text-xs text-text-secondary">25% bonus to ELO gain</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-accent mb-2">1.5x</div>
            <p className="text-sm text-text-secondary mb-2">Dominance (10+ points)</p>
            <p className="text-xs text-text-secondary">50% bonus to ELO gain</p>
          </Card>
        </div>

        <p className="mt-4 text-sm text-text-secondary">
          <strong>Note:</strong> Tournament matches always use 1.0x multiplier (win/loss only).
        </p>
      </section>

      {/* Seasons Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Monthly Seasons</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
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
              added to their forever ELO. This makes season championships meaningful for
              your lifetime ranking!
            </p>
          </Card>
        </div>
      </section>

      {/* Tournaments Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Tournaments</h2>
        
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-6 w-6 text-accent" />
            <h3 className="text-lg font-semibold">Paid Entry with Prize Pool</h3>
          </div>
          <p className="text-text-secondary text-sm mb-4">
            Tournaments use a tiered entry system based on your current ELO. The platform
            adds 500 ELO to each tournament prize pool to ensure everyone can win.
          </p>

          <div className="overflow-hidden rounded-lg border border-border">
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
        </Card>

        <h3 className="text-lg font-semibold mb-4">Prize Distribution</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500 mb-1">1st</div>
            <p className="text-2xl font-bold text-text-primary">60%</p>
            <p className="text-xs text-text-secondary">of prize pool</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-400 mb-1">2nd</div>
            <p className="text-2xl font-bold text-text-primary">25%</p>
            <p className="text-xs text-text-secondary">of prize pool</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-400 mb-1">3rd</div>
            <p className="text-2xl font-bold text-text-primary">7.5%</p>
            <p className="text-xs text-text-secondary">of prize pool</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-400 mb-1">4th</div>
            <p className="text-2xl font-bold text-text-primary">7.5%</p>
            <p className="text-xs text-text-secondary">of prize pool</p>
          </Card>
        </div>
      </section>

      {/* Activity Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Staying Active</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-6 w-6 text-green-500" />
              <h3 className="text-lg font-semibold">Activity Bonus</h3>
            </div>
            <p className="text-text-secondary text-sm">
              Play <strong>2+ matches per week</strong> to earn an activity bonus. This helps
              keep the ELO economy fresh and rewards regular players.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-semibold">Rusty Badge</h3>
            </div>
            <p className="text-text-secondary text-sm">
              If you haven&apos;t played for <strong>4+ weeks</strong>, you&apos;ll see a &quot;Rusty&quot;
              badge on your profile. This is just informational—it doesn&apos;t affect your ELO.
            </p>
          </Card>
        </div>
      </section>

      {/* Fair Play Section */}
      <section>
        <Card className="p-6 bg-accent/5 border-accent/20">
          <h2 className="text-xl font-bold text-text-primary mb-4">Fair Play</h2>
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
    </div>
  );
}
