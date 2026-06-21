'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Activity as ActivityIcon, Trophy, Flame, Star, TrendingUp } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

interface Activity {
  id: string;
  type: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface ActivityFeedProps {
  userId?: string;
  limit?: number;
  compact?: boolean;
  title?: string;
}

const TYPE_ICONS: Record<string, ReactNode> = {
  match: <TrendingUp className="h-4 w-4 text-green-500" />,
  achievement: <Star className="h-4 w-4 text-yellow-500" />,
  streak: <Flame className="h-4 w-4 text-orange-500" />,
  season: <Trophy className="h-4 w-4 text-purple-500" />,
  milestone: <ActivityIcon className="h-4 w-4 text-blue-500" />,
};

function formatTimeAgo(date: string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

/**
 * Activity Feed Component
 */
export function ActivityFeed({ userId, limit = 10, compact = false, title = 'Activity' }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const params = new URLSearchParams({ limit: String(limit) });
        if (userId) params.set('userId', userId);
        
        const res = await fetch(`/api/activity?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setActivities(data.activities || []);
        }
      } catch (e) {
        console.error('Failed to fetch activity:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActivity();
  }, [userId, limit]);

  if (isLoading) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-4">{title}</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-4">{title}</h3>
        <p className="text-text-secondary text-sm text-center py-4">
          No recent activity yet
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <ActivityIcon className="h-5 w-5" />
        {title}
      </h3>
      
      <div className="space-y-4">
        {activities.map(activity => (
          <div key={activity.id} className="flex items-start gap-3">
            {activity.user ? (
              <Link href={`/profile/${activity.user.id}`}>
                <Avatar
                  src={activity.user.image}
                  alt={activity.user.name}
                  fallback={activity.user.name.charAt(0)}
                  size="sm"
                />
              </Link>
            ) : (
              <div className="h-8 w-8 rounded-full bg-bg-secondary flex items-center justify-center">
                {TYPE_ICONS[activity.type] || <ActivityIcon className="h-4 w-4" />}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${compact ? '' : 'leading-relaxed'}`}>
                {activity.user && !compact && (
                  <Link href={`/profile/${activity.user.id}`} className="font-semibold hover:underline">
                    {activity.user.name}
                  </Link>
                )}
                {' '}
                <span className="text-text-secondary">{activity.message}</span>
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {formatTimeAgo(activity.createdAt)}
              </p>
            </div>
            
            <div className="flex-shrink-0">
              {TYPE_ICONS[activity.type]}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
