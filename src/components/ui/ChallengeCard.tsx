'use client';

import { useState, ReactNode } from 'react';
import { Swords, Clock, Trophy, X, Check, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import Link from 'next/link';

interface Challenge {
  id: string;
  challengerId: string;
  challengedId: string;
  stakeAmount: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  challenger: {
    id: string;
    name: string;
    image: string | null;
    foreverElo: number;
  };
  challenged: {
    id: string;
    name: string;
    image: string | null;
    foreverElo: number;
  };
}

interface ChallengeCardProps {
  challenge: Challenge;
  currentUserId: string;
  onUpdate?: () => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: ReactNode }> = {
  PENDING: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-600 dark:text-yellow-400',
    icon: <Clock className="h-4 w-4" />,
  },
  ACCEPTED: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    icon: <Check className="h-4 w-4" />,
  },
  COMPLETED: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    icon: <Trophy className="h-4 w-4" />,
  },
  DECLINED: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-600 dark:text-gray-400',
    icon: <X className="h-4 w-4" />,
  },
  CANCELLED: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-600 dark:text-gray-400',
    icon: <X className="h-4 w-4" />,
  },
  EXPIRED: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-600 dark:text-gray-400',
    icon: <Clock className="h-4 w-4" />,
  },
};

function formatTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - new Date().getTime();
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return 'Less than 1h';
}

export function ChallengeCard({ challenge, currentUserId, onUpdate }: ChallengeCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const isChallenger = challenge.challengerId === currentUserId;
  const isChallenged = challenge.challengedId === currentUserId;
  const opponent = isChallenger ? challenge.challenged : challenge.challenger;
  const style = STATUS_STYLES[challenge.status] || STATUS_STYLES.PENDING;

  const handleAction = async (action: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/challenges/${challenge.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      
      if (res.ok && onUpdate) {
        onUpdate();
      }
    } catch (e) {
      console.error('Failed to update challenge:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`p-4 ${style.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          <span className="font-semibold">Challenge</span>
        </div>
        <div className={`flex items-center gap-1 text-sm ${style.text}`}>
          {style.icon}
          <span>{challenge.status}</span>
        </div>
      </div>

      {/* Players */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${challenge.challenger.id}`}>
            <Avatar
              src={challenge.challenger.image}
              alt={challenge.challenger.name}
              fallback={challenge.challenger.name.charAt(0)}
              size="sm"
            />
          </Link>
          <div>
            <p className="text-sm font-medium">{challenge.challenger.name}</p>
            <p className="text-xs text-text-secondary">{challenge.challenger.foreverElo} ELO</p>
          </div>
        </div>
        
        <span className="text-text-secondary">vs</span>
        
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-medium">{challenge.challenged.name}</p>
            <p className="text-xs text-text-secondary">{challenge.challenged.foreverElo} ELO</p>
          </div>
          <Link href={`/profile/${challenge.challenged.id}`}>
            <Avatar
              src={challenge.challenged.image}
              alt={challenge.challenged.name}
              fallback={challenge.challenged.name.charAt(0)}
              size="sm"
            />
          </Link>
        </div>
      </div>

      {/* Stake */}
      {challenge.stakeAmount > 0 && (
        <div className="text-sm text-text-secondary mb-3">
          Stake: <span className="font-semibold text-primary">{challenge.stakeAmount} ELO</span>
        </div>
      )}

      {/* Time left */}
      {challenge.status === 'PENDING' && (
        <div className="text-xs text-text-secondary mb-3 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Expires in {formatTimeLeft(challenge.expiresAt)}
        </div>
      )}

      {/* Actions */}
      {challenge.status === 'PENDING' && isChallenged && (
        <div className="flex gap-2">
          <button
            onClick={() => handleAction('accept')}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Accept
          </button>
          <button
            onClick={() => handleAction('decline')}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Decline
          </button>
        </div>
      )}

      {challenge.status === 'PENDING' && isChallenger && (
        <button
          onClick={() => handleAction('cancel')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors text-sm"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          Cancel Challenge
        </button>
      )}

      {challenge.status === 'ACCEPTED' && (
        <Link
          href="/matches/new"
          className="block w-full text-center px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Record Match
        </Link>
      )}
    </Card>
  );
}
