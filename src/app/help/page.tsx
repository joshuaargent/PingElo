import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { HelpCircle, MessageCircle, Mail, Book, Users, Trophy } from 'lucide-react';

// ============================================
// Help Page
// ============================================

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Help Center"
        description="Get answers to common questions"
      />

      {/* Quick Links */}
      <section className="mb-12">
        <div className="grid md:grid-cols-3 gap-4">
          <a href="#elo" className="block">
            <Card className="p-6 hover:border-accent transition-colors cursor-pointer">
              <HelpCircle className="h-8 w-8 text-accent mb-3" />
              <h3 className="font-semibold mb-1">ELO Questions</h3>
              <p className="text-sm text-text-secondary">Understanding how ratings work</p>
            </Card>
          </a>
          <a href="#tournaments" className="block">
            <Card className="p-6 hover:border-accent transition-colors cursor-pointer">
              <Users className="h-8 w-8 text-accent mb-3" />
              <h3 className="font-semibold mb-1">Tournaments</h3>
              <p className="text-sm text-text-secondary">Competing and winning prizes</p>
            </Card>
          </a>
          <a href="#account" className="block">
            <Card className="p-6 hover:border-accent transition-colors cursor-pointer">
              <Book className="h-8 w-8 text-accent mb-3" />
              <h3 className="font-semibold mb-1">Account</h3>
              <p className="text-sm text-text-secondary">Managing your profile</p>
            </Card>
          </a>
        </div>
      </section>

      {/* ELO Questions */}
      <section id="elo" className="mb-12 scroll-mt-20">
        <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-accent" />
          ELO Questions
        </h2>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Why did my ELO change by that amount?</h3>
            <p className="text-text-secondary text-sm mb-3">
              ELO changes depend on three factors:
            </p>
            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1 mb-3">
              <li><strong>Expected outcome:</strong> If you beat someone ranked lower than you, you gain less. Upsets yield bigger rewards.</li>
              <li><strong>Your experience:</strong> New players get larger changes (K-factor) to converge faster.</li>
              <li><strong>Score margin:</strong> In casual matches, dominating wins (10+ point difference) earn a 1.5x bonus.</li>
            </ul>
            <p className="text-sm text-text-secondary">
              View any match to see a full breakdown of the calculation.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">What&apos;s the difference between Forever and Season ELO?</h3>
            <p className="text-text-secondary text-sm">
              <strong>Forever ELO</strong> is your lifetime rating that never resets. <strong>Season ELO</strong>
              resets monthly to give everyone a fresh start. Season champions earn a 10% bonus added to
              their Forever ELO.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">What does &quot;Rusty&quot; mean?</h3>
            <p className="text-text-secondary text-sm">
              If you haven&apos;t played for 4+ weeks, you&apos;ll see a &quot;Rusty&quot; badge on your profile.
              This is just informational to let others know you might be out of practice—it doesn&apos;t
              affect your actual ELO rating.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">What does &quot;Active&quot; mean?</h3>
            <p className="text-text-secondary text-sm">
              Players who play 2+ matches per week earn an &quot;Active&quot; badge. This helps identify
              who's currently in form and playing regularly.
            </p>
          </Card>
        </div>
      </section>

      {/* Singles vs Doubles */}
      <section id="singles-doubles" className="mb-12 scroll-mt-20">
        <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <Users className="h-6 w-6 text-accent" />
          Singles vs Doubles
        </h2>

        <div className="space-y-4">
          <Card className="p-6 bg-accent/10 border-accent/20">
            <h3 className="font-semibold mb-2">Are singles and doubles separate ratings?</h3>
            <p className="text-text-secondary text-sm mb-3">
              <strong>Yes!</strong> Singles and doubles have completely separate ELO ratings. Your 
              performance in one doesn't affect the other. You could be 1500 in singles and 800 in 
              doubles (or vice versa).
            </p>
            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
              <li>Singles has its own Forever ELO and Season ELO</li>
              <li>Doubles has its own Forever ELO and Season ELO</li>
              <li>Each mode has its own leaderboard and season champion</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">What's the difference between casual and tournament matches?</h3>
            <div className="text-sm text-text-secondary space-y-2">
              <p><strong>Casual Matches:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>For singles: just pick any opponent</li>
                <li>For doubles: pick any 4 players (no team registration needed)</li>
                <li>Score margin bonuses apply (1.25x for clear wins, 1.5x for dominance)</li>
                <li>90% of ELO change counts toward season ELO</li>
              </ul>
              <p className="mt-3"><strong>Tournament Matches:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Singles: same as casual, just in tournament bracket</li>
                <li>Doubles: must use registered teams from current season</li>
                <li>No score margin bonus (1.0x multiplier)</li>
                <li>Full ELO change counts toward season ELO</li>
              </ul>
            </div>
          </Card>
        </div>
      </section>

      {/* Teams */}
      <section id="teams" className="mb-12 scroll-mt-20">
        <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <Users className="h-6 w-6 text-accent" />
          Teams
        </h2>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">How do teams work?</h3>
            <p className="text-text-secondary text-sm mb-3">
              Teams are for doubles partnerships. When you play doubles with a registered team, 
              the team's stats (wins, losses) are tracked together.
            </p>
            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
              <li>Team ELO is the average of both players' doubles ELO</li>
              <li>Teams accumulate wins and losses together</li>
              <li>Both players see the team stats on their profiles</li>
            </ul>
          </Card>

          <Card className="p-6 bg-orange-500/10 border-orange-500/30">
            <h3 className="font-semibold mb-2">Team limits this season</h3>
            <div className="text-sm text-text-secondary space-y-2">
              <p><strong>Per Season Rules:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>You can <strong>create 1 team</strong> per season</li>
                <li>You can be in <strong>up to 2 teams</strong> per season</li>
                <li>Teams reset when a new season starts</li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Example: How does team creation work?</h3>
            <div className="text-sm text-text-secondary space-y-2">
              <p>Let's say you're Alex and you want to team with Jordan:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>You create a team with Jordan → <strong>You're in 1 team, Jordan's in 1 team</strong></li>
                <li>Sam can create a team with Jordan too → <strong>Jordan's in 2 teams now, Sam created their team</strong></li>
                <li>Sam can also create a team with you → <strong>You're in 2 teams now!</strong></li>
                <li>But you can't create a 3rd team (you've reached your limit)</li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">When are teams required?</h3>
            <p className="text-text-secondary text-sm">
              <strong>Tournaments:</strong> Doubles tournaments require you to register with a team 
              from the current season. This ensures fair competition.
            </p>
            <p className="text-text-secondary text-sm mt-2">
              <strong>Casual Games:</strong> You can play ad-hoc doubles with any 4 players—no 
              team registration needed!
            </p>
          </Card>
        </div>
      </section>

      {/* Tournament Questions */}
      <section id="tournaments" className="mb-12 scroll-mt-20">
        <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <Users className="h-6 w-6 text-accent" />
          Tournament Questions
        </h2>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">How do I join a tournament?</h3>
            <p className="text-text-secondary text-sm">
              Browse open tournaments and click &quot;Join&quot;. Your entry fee (based on your current ELO)
              will be deducted. Players below 800 ELO enter for free!
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">How are tournament prizes distributed?</h3>
            <div className="text-sm text-text-secondary space-y-1 mb-3">
              <p>The platform adds 500 ELO to each tournament prize pool:</p>
              <ul className="list-disc list-inside">
                <li><strong>1st place:</strong> 60% of prize pool</li>
                <li><strong>2nd place:</strong> 25% of prize pool</li>
                <li><strong>3rd-4th:</strong> 7.5% each</li>
              </ul>
            </div>
            <p className="text-sm text-text-secondary">
              This ensures even non-winners can gain ELO from participating.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Can I leave a tournament?</h3>
            <p className="text-text-secondary text-sm">
              You can leave a tournament while registration is still open. Your entry fee will be refunded.
              Once the tournament starts, you cannot leave.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Why do tournament matches have no margin bonus?</h3>
            <p className="text-text-secondary text-sm">
              Tournament matches use a 1.0x multiplier (no bonus) to keep things fair. In a tournament,
              the goal is to win, not necessarily win big. This makes tournament play more strategic.
            </p>
          </Card>
        </div>
      </section>

      {/* Account Questions */}
      <section id="account" className="mb-12 scroll-mt-20">
        <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <Book className="h-6 w-6 text-accent" />
          Account Questions
        </h2>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">How do I create an account?</h3>
            <p className="text-text-secondary text-sm">
              You can sign up with Google OAuth for quick access, or create an account with your email
              and a password. Your ELO starts at 1000.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Can I change my display name?</h3>
            <p className="text-text-secondary text-sm">
              Yes, you can update your display name in your profile settings. Your ELO and match history
              remain unchanged.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Why can&apos;t I log matches?</h3>
            <p className="text-text-secondary text-sm">
              You may be banned or have a suspended account. Contact an admin if you believe this is
              an error.
            </p>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section>
        <Card className="p-6 bg-accent/5 border-accent/20">
          <div className="flex items-start gap-4">
            <MessageCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Still have questions?</h3>
              <p className="text-text-secondary text-sm mb-4">
                Can&apos;t find what you&apos;re looking for? Reach out and we&apos;ll get back to you.
              </p>
              <a
                href="mailto:hello@pingelo.app"
                className="inline-flex items-center gap-2 text-accent hover:underline text-sm font-medium"
              >
                <Mail className="h-4 w-4" />
                hello@pingelo.app
              </a>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
