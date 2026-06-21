'use client';
import { PageHero } from '@/components/layout/PageHero';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Trophy, User, Users as UsersIcon } from 'lucide-react';

type MatchType = 'SINGLES' | 'DOUBLES';
type Format = 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN' | 'SWISS';

const formats: { value: Format; label: string; description: string }[] = [
  { value: 'SINGLE_ELIMINATION', label: 'Single Elimination', description: 'Lose once and you\'re out' },
  { value: 'DOUBLE_ELIMINATION', label: 'Double Elimination', description: 'Must lose twice to be eliminated' },
  { value: 'ROUND_ROBIN', label: 'Round Robin', description: 'Everyone plays everyone' },
  { value: 'SWISS', label: 'Swiss', description: 'No elimination, standings-based pairings' },
];

export default function CreateTournamentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [matchType, setMatchType] = useState<MatchType>('SINGLES');
  const [format, setFormat] = useState<Format>('SINGLE_ELIMINATION');
  const [maxParticipants, setMaxParticipants] = useState('8');
  const [entryFee, setEntryFee] = useState('0');
  const [maxScore, setMaxScore] = useState('21');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a tournament name');
      return;
    }

    const maxScoreNum = parseInt(maxScore);
    const validMaxScores = [7, 11, 15, 21];
    if (isNaN(maxScoreNum) || !validMaxScores.includes(maxScoreNum)) {
      setError('Max score must be 7, 11, 15, or 21');
      return;
    }

    const entryFeeNum = parseInt(entryFee);
    if (isNaN(entryFeeNum) || entryFeeNum < 0) {
      setError('Entry Fee must be 0 or higher');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          matchType,
          format,
          maxParticipants: parseInt(maxParticipants),
          entryFee: entryFeeNum,
          maxScore: maxScoreNum,
          status: 'REGISTRATION_OPEN',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/tournaments/${data.tournament.id}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create tournament');
      }
    } catch (err) {
      setError('Failed to create tournament');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHero
        title="Create Tournament"
        description="Set up a new competition for your ping pong community"
        backHref="/tournaments"
        backLabel="Back to Tournaments"
      />

      {/* Content Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-2xl">
          {error && (
            <Card className="p-4 mb-6 border-red-500/50 bg-red-500/10">
              <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
            </Card>
          )}

          {/* Basic Info */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Tournament Name *
                </label>
                <Input
                  placeholder="Weekly Championship"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Description
                </label>
                <textarea
                  className="w-full h-24 px-4 py-3 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                  placeholder="Optional description of your tournament..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Match Type */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Match Type</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMatchType('SINGLES')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  matchType === 'SINGLES'
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/50'
                }`}
              >
                <User className={`h-8 w-8 mx-auto mb-2 ${matchType === 'SINGLES' ? 'text-accent' : 'text-text-muted'}`} />
                <p className={`font-medium ${matchType === 'SINGLES' ? 'text-accent' : 'text-text-primary'}`}>Singles</p>
                <p className="text-sm text-text-muted">1v1 matches</p>
              </button>

              <button
                onClick={() => setMatchType('DOUBLES')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  matchType === 'DOUBLES'
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/50'
                }`}
              >
                <UsersIcon className={`h-8 w-8 mx-auto mb-2 ${matchType === 'DOUBLES' ? 'text-accent' : 'text-text-muted'}`} />
                <p className={`font-medium ${matchType === 'DOUBLES' ? 'text-accent' : 'text-text-primary'}`}>Doubles</p>
                <p className="text-sm text-text-muted">2v2 teams</p>
              </button>
            </div>
          </Card>

          {/* Format */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Tournament Format</h2>
            
            <div className="space-y-3">
              {formats.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    format === f.value
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${format === f.value ? 'text-accent' : 'text-text-primary'}`}>
                        {f.label}
                      </p>
                      <p className="text-sm text-text-muted">{f.description}</p>
                    </div>
                    {format === f.value && (
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Settings */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Max Participants
                </label>
                <select
                  className="w-full h-12 px-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                >
                  <option value="4">4</option>
                  <option value="8">8</option>
                  <option value="16">16</option>
                  <option value="32">32</option>
                  <option value="64">64</option>
                </select>
                <p className="text-sm text-text-muted mt-2">
                  {matchType === 'DOUBLES' 
                    ? `This will create ${parseInt(maxParticipants)} teams of 2`
                    : `This will allow ${parseInt(maxParticipants)} players`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Entry Fee (ELO)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  placeholder="0"
                />
                <p className="text-sm text-text-muted mt-2">
                  Players pay this ELO to join. It goes into the prize pool. Set to 0 for free tournaments.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Max Score (Points to Win)
                </label>
                <select
                  className="w-full h-12 px-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                >
                  <option value="7">7 Points</option>
                  <option value="11">11 Points</option>
                  <option value="15">15 Points</option>
                  <option value="21">21 Points</option>
                </select>
                <p className="text-sm text-text-muted mt-2">
                  Points needed to win a game.
                </p>
              </div>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/tournaments">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              Create Tournament
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
