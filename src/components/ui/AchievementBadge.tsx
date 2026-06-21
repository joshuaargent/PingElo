'use client';

import { ReactNode } from 'react';
import { Star, Trophy, Flame, Zap, Target, Crown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Database schema matches this interface
interface Achievement {
  id: string;
  slug: string;
  name: string;
  desc: string;
  icon: string;
  tier: string;
  unlockedAt?: Date | string;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  locked?: boolean;
}

// Map tier to colors
const TIER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  bronze: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-600 dark:text-orange-400' },
  silver: { bg: 'bg-gray-100 dark:bg-gray-800/20', border: 'border-gray-300 dark:border-gray-700', text: 'text-gray-500 dark:text-gray-400' },
  gold: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-600 dark:text-yellow-400' },
  platinum: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-600 dark:text-purple-400' },
};

const ICON_MAP: Record<string, ReactNode> = {
  star: <Star className="h-full w-full" />,
  trophy: <Trophy className="h-full w-full" />,
  flame: <Flame className="h-full w-full" />,
  zap: <Zap className="h-full w-full" />,
  target: <Target className="h-full w-full" />,
  crown: <Crown className="h-full w-full" />,
};

const SIZE_CLASSES = {
  sm: { container: 'w-10 h-10', icon: 'h-5 w-5', text: 'text-xs' },
  md: { container: 'w-14 h-14', icon: 'h-7 w-7', text: 'text-sm' },
  lg: { container: 'w-20 h-20', icon: 'h-10 w-10', text: 'text-base' },
};

export function AchievementBadge({
  achievement,
  size = 'md',
  showDetails = false,
  locked = false
}: AchievementBadgeProps) {
  const colors = TIER_COLORS[achievement.tier?.toLowerCase()] || TIER_COLORS.bronze;
  const sizes = SIZE_CLASSES[size];

  // Check if icon is an emoji or a icon key
  const isEmoji = achievement.icon && achievement.icon.length <= 4 && /[\u{1F300}-\u{1F9FF}]/u.test(achievement.icon);
  const iconElement = isEmoji ? (
    <span className="text-2xl h-full w-full flex items-center justify-center">{achievement.icon}</span>
  ) : (
    ICON_MAP[achievement.icon] || <Star className="h-full w-full" />
  );

  if (showDetails) {
    return (
      <div className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-all',
        locked
          ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
          : `${colors.bg} ${colors.border}`,
      )}>
        <div className={cn(
          'flex-shrink-0 rounded-lg flex items-center justify-center',
          sizes.container,
          locked
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
            : colors.text,
        )}>
          {locked ? <Lock className={sizes.icon} /> : iconElement}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn('font-semibold text-text-primary', sizes.text)}>
              {locked ? '???' : achievement.name}
            </h4>
            {achievement.tier && !locked && (
              <span className={cn('text-xs uppercase font-bold', 
                achievement.tier === 'gold' && 'text-yellow-500',
                achievement.tier === 'silver' && 'text-gray-400',
                achievement.tier === 'bronze' && 'text-orange-500',
                achievement.tier === 'platinum' && 'text-purple-400'
              )}>
                {achievement.tier}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {locked ? 'Keep playing to unlock!' : achievement.desc}
          </p>
          {achievement.unlockedAt && !locked && (
            <p className="text-xs text-text-muted mt-1">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105',
        sizes.container,
        locked
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
          : `${colors.bg} ${colors.text}`,
      )}
      title={locked ? 'Locked' : `${achievement.name} (${achievement.tier})`}
    >
      {locked ? <Lock className={sizes.icon} /> : iconElement}
    </div>
  );
}

// Grid component for displaying multiple achievements
interface AchievementGridProps {
  achievements: Achievement[];
  lockedAchievements?: Achievement[];
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export function AchievementGrid({
  achievements,
  lockedAchievements = [],
  size = 'md',
  showDetails = false
}: AchievementGridProps) {
  if (showDetails) {
    return (
      <div className="space-y-2">
        {achievements.map((a) => (
          <AchievementBadge key={a.id} achievement={a} size={size} showDetails />
        ))}
        {lockedAchievements.map((a) => (
          <AchievementBadge key={a.id} achievement={a} size={size} showDetails locked />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {achievements.map((a) => (
        <AchievementBadge key={a.id} achievement={a} size={size} />
      ))}
      {lockedAchievements.map((a) => (
        <AchievementBadge key={a.id} achievement={a} size={size} locked />
      ))}
    </div>
  );
}
