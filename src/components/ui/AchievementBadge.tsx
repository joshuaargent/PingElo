'use client';

import { ReactNode } from 'react';
import { Star, Trophy, Flame, Zap, Target, Crown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlockedAt?: string;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  locked?: boolean;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  match: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-600 dark:text-green-400' },
  win: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-600 dark:text-yellow-400' },
  streak: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-600 dark:text-orange-400' },
  elo: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-600 dark:text-purple-400' },
  special: { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-200 dark:border-pink-800', text: 'text-pink-600 dark:text-pink-400' },
  season: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600 dark:text-blue-400' },
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
  const colors = CATEGORY_COLORS[achievement.category] || CATEGORY_COLORS.special;
  const sizes = SIZE_CLASSES[size];
  
  const iconElement = ICON_MAP[achievement.icon] || <Star className="h-full w-full" />;

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
          <h4 className={cn(
            'font-semibold text-text-primary',
            sizes.text
          )}>
            {locked ? '???' : achievement.name}
          </h4>
          <p className="text-xs text-text-secondary mt-0.5">
            {locked ? 'Keep playing to unlock!' : achievement.description}
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
      title={locked ? 'Locked' : achievement.name}
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
  const allUnlocked = achievements.length > 0 && lockedAchievements.length === 0;
  
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
