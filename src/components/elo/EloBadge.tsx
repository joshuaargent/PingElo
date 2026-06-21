'use client';

import { forwardRef } from 'react';
import { cn, formatNumber } from '@/lib/utils';
import { getEloTierBadgeColor, getPlayerTier } from '@/lib/elo';

interface EloBadgeProps {
  elo: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

/**
 * Badge displaying player's ELO with skill tier styling
 */
export const EloBadge = forwardRef<HTMLSpanElement, EloBadgeProps>(
  ({ elo, showLabel = true, size = 'md', className }, ref) => {
    const badgeColor = getEloTierBadgeColor(elo);
    const tier = getPlayerTier(elo);

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium',
          badgeColor,
          sizeStyles[size],
          className
        )}
      >
        <span className="font-bold">{formatNumber(elo)}</span>
        {showLabel && (
          <span className="opacity-75">{tier.name}</span>
        )}
      </span>
    );
  }
);

EloBadge.displayName = 'EloBadge';
