import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

// ============================================
// Base Skeleton Component
// ============================================

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', width, height, ...props }, ref) => {
    const variantClasses = {
      text: 'rounded-md h-4',
      circular: 'rounded-full',
      rectangular: 'rounded-lg',
    };

    return (
      <div
        ref={ref}
        className={cn('skeleton', variantClasses[variant], className)}
        style={{ width, height }}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// ============================================
// PingElo-specific Skeletons
// ============================================

export const SkeletonText = forwardRef<HTMLDivElement, { lines?: number }>(({ lines = 3 }, ref) => (
  <div ref={ref} className="space-y-2" aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={i === lines - 1 ? 'w-3/4' : 'w-full'} />
    ))}
  </div>
));

SkeletonText.displayName = 'SkeletonText';

// Profile skeleton for user profiles
export function ProfileSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8" aria-hidden="true">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Skeleton variant="circular" className="w-24 h-24" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-bg-secondary/30 rounded-xl border border-border">
              <Skeleton className="h-10 w-16 mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>

        {/* Chart */}
        <Skeleton className="h-64 w-full mb-8" variant="rectangular" />
      </div>
    </div>
  );
}

// Match card skeleton
export function MatchCardSkeleton() {
  return (
    <div className="p-4 bg-bg-secondary/30 rounded-xl border border-border" aria-hidden="true">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" className="w-10 h-10" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-8 w-16" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton variant="circular" className="w-10 h-10" />
        </div>
      </div>
    </div>
  );
}

// Leaderboard row skeleton
export function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3" aria-hidden="true">
      <Skeleton className="w-8 h-8" />
      <Skeleton variant="circular" className="w-12 h-12" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

// Full leaderboard skeleton
export function LeaderboardSkeleton() {
  return (
    <div className="bg-bg-primary rounded-xl border border-border overflow-hidden" aria-hidden="true">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-bg-secondary border-b border-border">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24 ml-auto" />
      </div>
      {/* Rows */}
      {[...Array(10)].map((_, i) => (
        <LeaderboardRowSkeleton key={i} />
      ))}
    </div>
  );
}

// Match list skeleton
export function MatchListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {[...Array(count)].map((_, i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Team card skeleton
export function TeamCardSkeleton() {
  return (
    <div className="p-4 bg-bg-secondary/30 rounded-xl border border-border" aria-hidden="true">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="w-10 h-10" />
        <Skeleton className="h-4 w-20" />
        <span className="text-text-muted">+</span>
        <Skeleton variant="circular" className="w-10 h-10" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

// Tournament card skeleton
export function TournamentCardSkeleton() {
  return (
    <div className="p-4 bg-bg-secondary/30 rounded-xl border border-border" aria-hidden="true">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-8" variant="rectangular" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

// Stats card skeleton
export function StatsCardSkeleton() {
  return (
    <div className="p-4 bg-bg-secondary/30 rounded-xl border border-border text-center" aria-hidden="true">
      <Skeleton className="h-10 w-16 mx-auto mb-2" />
      <Skeleton className="h-4 w-24 mx-auto" />
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={`bg-bg-secondary/30 rounded-xl border border-border p-4 ${height}`} aria-hidden="true">
      <div className="flex items-end justify-between h-full gap-2 pb-4">
        {[...Array(12)].map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1" 
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Legacy presets (kept for compatibility)
// ============================================

export const SkeletonCard = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className="bg-bg-secondary/30 rounded-xl border border-border space-y-4 p-6" aria-hidden="true">
    <Skeleton className="h-48 w-full" variant="rectangular" />
    <Skeleton className="h-6 w-3/4" />
    <SkeletonText lines={2} />
  </div>
));

SkeletonCard.displayName = 'SkeletonCard';

export const SkeletonVideoCard = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className="space-y-3" aria-hidden="true">
    <Skeleton className="aspect-video w-full" variant="rectangular" />
    <Skeleton className="h-5 w-full" />
    <Skeleton className="h-4 w-1/2" />
  </div>
));

SkeletonVideoCard.displayName = 'SkeletonVideoCard';

export const SkeletonBookCard = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className="space-y-3" aria-hidden="true">
    <Skeleton className="aspect-[2/3] w-full" variant="rectangular" />
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
));

SkeletonBookCard.displayName = 'SkeletonBookCard';

export const SkeletonProjectCard = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className="bg-bg-secondary/30 rounded-xl border border-border space-y-4 p-6" aria-hidden="true">
    <Skeleton className="h-40 w-full" variant="rectangular" />
    <Skeleton className="h-6 w-2/3" />
    <SkeletonText lines={2} />
    <div className="flex gap-2">
      <Skeleton className="h-6 w-16" variant="rectangular" />
      <Skeleton className="h-6 w-16" variant="rectangular" />
      <Skeleton className="h-6 w-16" variant="rectangular" />
    </div>
  </div>
));

SkeletonProjectCard.displayName = 'SkeletonProjectCard';
