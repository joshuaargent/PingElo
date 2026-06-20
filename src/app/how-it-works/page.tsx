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
                <td className="px-4 py-3 text-sm">0-9 games</td>
                <td className="px-4 py-3">
                  <Badge variant="primary" size="sm">64</Badge>
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">Rapid adjustment for new players</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm">10-29 games</td>
                <td className="px-4 py-3">
                  <Badge variant="default" size="sm">48</Badge>
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">Still adjusting quickly</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm">30-99 games</td>
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

        <p className="mt-4 text-sm text-text-secondary">
          <strong>Example:</strong> K=32, blowout win (10+ pts): Winner gets +24 ELO, Loser loses 24 ELO
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
              added to their forever ELO. This applies to singles, doubles (individual), AND 
              teams! Season championships matter for everyone.
            </p>
          </Card>
        </div>
      </section>

      {/* Forever vs Season ELO */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Understanding Your ELO</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 border-2 border-blue-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold">Forever ELO</h3>
            </div>
            <p className="text-text-secondary text-sm mb-3">
              Your career-long rating that never resets. This is what you&apos;re known for—it 
              grows as you gain experience and win matches over time.
            </p>
            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
              <li>Displayed on your profile and match history</li>
              <li>Used for tournament seeding</li>
              <li>Persists forever (hence the name!)</li>
              <li>Tournament entry fees are based on this</li>
            </ul>
          </Card>

          <Card className="p-6 border-2 border-green-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold">Season ELO</h3>
            </div>
            <p className="text-text-secondary text-sm mb-3">
              Your rating for the current season. Resets to 1000 at the start of each month, 
              giving everyone a fresh chance to compete.
            </p>
            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
              <li>Used for the season leaderboard</li>
              <li>Resets monthly (every 1st of the month)</li>
              <li>90% of gains count toward season (10% goes to forever)</li>
              <li>Season winner gets bonus added to their Forever ELO</li>
            </ul>
          </Card>
        </div>

        <Card className="p-4 bg-bg-secondary mb-6">
          <p className="text-sm text-text-secondary">
            <strong>Quick tip:</strong> The leaderboard lets you filter by &quot;All Time&quot; (Forever ELO) 
            or &quot;Season&quot; (Season ELO). Your profile shows both so you can track your career 
            progress and current form!
          </p>
        </Card>

        {/* Singles vs Doubles */}
        <h3 className="text-lg font-semibold mb-4">Singles vs Doubles: Separate Ratings!</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 border-2 border-purple-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h4 className="font-semibold">Singles (1v1)</h4>
                <p className="text-xs text-text-muted">Your solo rating</p>
              </div>
            </div>
            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
              <li><strong>Singles Forever ELO</strong> - never resets</li>
              <li><strong>Singles Season ELO</strong> - resets monthly</li>
              <li>Your individual performance</li>
            </ul>
          </Card>

          <Card className="p-6 border-2 border-orange-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold">Doubles (2v2)</h4>
                <p className="text-xs text-text-muted">Your team rating</p>
              </div>
            </div>
            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
              <li><strong>Doubles Forever ELO</strong> - never resets</li>
              <li><strong>Doubles Season ELO</strong> - resets monthly</li>
              <li>Requires forming teams</li>
            </ul>
          </Card>
        </div>

        <Card className="p-4 bg-accent/10 border-accent/20 mt-6">
          <p className="text-sm text-text-secondary">
            <strong>Important:</strong> Singles and doubles are <em>completely separate</em>! 
            Your 1500 in singles doesn&apos;t affect your 800 in doubles. Each mode has its own 
            ELO, its own leaderboard, and its own season champion.
          </p>
        </Card>
      </section>

      {/* Doubles Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Doubles Teams</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-6 w-6 text-accent" />
              <h3 className="text-lg font-semibold">Seasonal Teams</h3>
            </div>
            <p className="text-text-secondary text-sm mb-4">
              Teams are tied to the current season and reset when a new season starts. 
              This lets you form different partnerships over time!
            </p>
            <ul className="list-disc list-inside text-sm text-text-secondary space-y-2">
              <li><strong>Create:</strong> You can create <em>1 team</em> per season</li>
              <li><strong>Join:</strong> You can be in <em>up to 2 teams</em> per season</li>
              <li><strong>Example:</strong> You create a team with Alex. Jordan can create a team with you. Now you&apos;re in 2 teams!</li>
            </ul>
          </Card>

          <Card className="p-6 border-2 border-accent/50">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-6 w-6 text-accent" />
              <h3 className="text-lg font-semibold">Team ELO - Your Team Has Its Own Identity!</h3>
            </div>
            <p className="text-text-secondary text-sm mb-4">
              When you form a team, your team becomes its own entity with its own ELO. 
              This means your team&apos;s reputation is yours to build and defend!
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-bg-secondary rounded-lg">
                <h4 className="font-semibold text-sm mb-1">Team&apos;s Own ELO</h4>
                <p className="text-xs text-text-secondary">
                  Your team starts at <strong>1000 ELO</strong> and goes up or down based on team performance. 
                  This is separate from individual player ELOs!
                </p>
              </div>
              <div className="p-3 bg-bg-secondary rounded-lg">
                <h4 className="font-semibold text-sm mb-1">Your Team&apos;s K-Factor</h4>
                <p className="text-xs text-text-secondary">
                  Your team has its own K-factor based on <strong>how many matches your team has played</strong>. 
                  A new team adjusts quickly, a veteran team changes slowly.
                </p>
              </div>
              <div className="p-3 bg-bg-secondary rounded-lg">
                <h4 className="font-semibold text-sm mb-1">How You Affect Team ELO</h4>
                <p className="text-xs text-text-secondary">
                  When you play doubles, your <strong>individual ELO changes</strong> use YOUR K-factor 
                  (based on your personal doubles games), while your <strong>TEAM&apos;S ELO changes</strong> 
                  use your TEAM&apos;S K-factor.
                </p>
              </div>
            </div>
            <ul className="mt-4 list-disc list-inside text-sm text-text-secondary space-y-1">
              <li>Teams persist across seasons</li>
              <li>Teams become inactive at season end but can be reactivated</li>
              <li>If you haven&apos;t played any matches yet, you can delete the team</li>
              <li>Teams that have played are preserved in history (can&apos;t be deleted)</li>
              <li>Your team&apos;s ELO is yours to fight for!</li>
              <li>Visit the <a href="/teams" className="text-accent hover:underline">Teams page</a> to manage</li>
            </ul>
          </Card>
        </div>

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
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Tournaments</h2>
        
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
            <div className="text-2xl font-bold text-yellow-500 mb-1">1st</div>
            <p className="text-2xl font-bold text-text-primary">50%</p>
            <p className="text-xs text-text-secondary">of prize pool</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-400 mb-1">2nd</div>
            <p className="text-2xl font-bold text-text-primary">35%</p>
            <p className="text-xs text-text-secondary">of prize pool</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-400 mb-1">3rd</div>
            <p className="text-2xl font-bold text-text-primary">15%</p>
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
