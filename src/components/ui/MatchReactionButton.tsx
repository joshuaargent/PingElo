'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Reaction {
  emoji: string;
  label: string;
}

const REACTIONS: Reaction[] = [
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💪', label: 'Strong' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😂', label: 'Lol' },
  { emoji: '🏆', label: 'Champ' },
];

interface ReactionCounts {
  [emoji: string]: number;
}

interface MatchReactionButtonProps {
  matchId: string;
  initialReactions?: ReactionCounts;
  currentUserId?: string;
  userReactions?: string[];
  onReact?: (emoji: string) => void;
  compact?: boolean;
}

export function MatchReactionButton({
  matchId,
  initialReactions = {},
  currentUserId,
  userReactions = [],
  onReact,
  compact = false,
}: MatchReactionButtonProps) {
  const [reactions, setReactions] = useState<ReactionCounts>(initialReactions);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const handleReact = async (emoji: string) => {
    if (!currentUserId || isSubmitting) return;
    
    setIsSubmitting(true);
    setShowPicker(false);
    
    // Optimistic update
    const hasReacted = userReactions.includes(emoji);
    setReactions(prev => ({
      ...prev,
      [emoji]: Math.max(0, (prev[emoji] || 0) + (hasReacted ? -1 : 1)),
    }));
    
    try {
      const res = await fetch('/api/matches/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, emoji }),
      });
      
      if (!res.ok) {
        // Revert on error
        setReactions(prev => ({
          ...prev,
          [emoji]: (prev[emoji] || 0) + (hasReacted ? 1 : -1),
        }));
      } else {
        onReact?.(emoji);
      }
    } catch {
      // Revert on error
      setReactions(prev => ({
        ...prev,
        [emoji]: (prev[emoji] || 0) + (hasReacted ? 1 : -1),
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasReactions = Object.values(reactions).some(count => count > 0);
  const displayReactions = REACTIONS.filter(r => reactions[r.emoji] > 0);

  return (
    <div className="relative">
      {/* Reaction summary */}
      {hasReactions && (
        <div className="flex flex-wrap gap-1 mb-2">
          {displayReactions.map(r => (
            <button
              key={r.emoji}
              onClick={() => handleReact(r.emoji)}
              disabled={!currentUserId || isSubmitting}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-sm',
                'bg-bg-secondary hover:bg-bg-tertiary transition-colors',
                userReactions.includes(r.emoji) && 'ring-2 ring-accent',
                !currentUserId && 'cursor-default opacity-70'
              )}
            >
              <span>{r.emoji}</span>
              <span className="text-xs text-text-secondary">{reactions[r.emoji]}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Add reaction button */}
      {currentUserId && (
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className={cn(
              'text-text-secondary hover:text-text-primary transition-colors',
              compact ? 'text-sm' : 'text-base'
            )}
          >
            {compact ? 'React' : '➕ Add reaction'}
          </button>
          
          {/* Reaction picker */}
          {showPicker && (
            <div className={cn(
              'absolute z-10 mt-1 p-2 rounded-lg border border-border bg-bg-primary shadow-lg',
              'flex gap-1',
              compact ? 'left-0' : 'left-0'
            )}>
              {REACTIONS.map(r => (
                <button
                  key={r.emoji}
                  onClick={() => handleReact(r.emoji)}
                  disabled={isSubmitting}
                  className="p-1.5 rounded hover:bg-bg-secondary transition-colors text-lg"
                  title={r.label}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Click outside to close */}
      {showPicker && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
