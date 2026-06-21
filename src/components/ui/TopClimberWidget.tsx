'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Trophy, Flame } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';

interface TopClimberUser {
  userId: string;
  name: string;
  image: string | null;
  eloGained: number;
  wins: number;
}

interface TopClimberWidgetProps {
  currentUserId?: string;
}

/**
 * Top Climber Widget - Shows weekly top performers
 */
export function TopClimberWidget({ currentUserId }: TopClimberWidgetProps) {
  const [eloLeader, setEloLeader] = useState<TopClimberUser | null>(null);
  const [winsLeader, setWinsLeader] = useState<TopClimberUser | null>(null);
  const [currentWeekStats, setCurrentWeekStats] = useState<{ elo: number; wins: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch current week's activity
        const weekRes = await fetch('/api/weekly-activity');
        if (weekRes.ok) {
          const weekData = await weekRes.json();
          if (weekData.currentWeek) {
            setCurrentWeekStats({
              elo: weekData.currentWeek.eloChange || 0,
              wins: weekData.currentWeek.wins || 0,
            });
          }
        }

        // Fetch leaders
        const leadersRes = await fetch('/api/top-climber/leaders');
        if (leadersRes.ok) {
          const leadersData = await leadersRes.json();
          setEloLeader(leadersData.eloLeader);
          setWinsLeader(leadersData.winsLeader);
        }
      } catch (e) {
        console.error('Failed to fetch top climber data:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate days until week ends (Friday)
  const now = new Date();
  const friday = new Date();
  friday.setDate(now.getDate() + ((5 + 7 - now.getDay()) % 7 || 7));
  friday.setHours(23, 59, 59, 999);
  const daysLeft = Math.ceil((friday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          This Week&apos;s Top Climbers
        </h3>
        <span className="text-xs text-text-secondary">
          {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
        </span>
      </div>

      <div className="space-y-3">
        {/* ELO Leader */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">ELO Gain</span>
          </div>
          {eloLeader ? (
            <div className="flex items-center gap-2">
              <Avatar
                src={eloLeader.image}
                alt={eloLeader.name}
                fallback={eloLeader.name.charAt(0)}
                size="sm"
              />
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                +{eloLeader.eloGained}
              </span>
            </div>
          ) : (
            <span className="text-sm text-text-secondary">No leader yet</span>
          )}
        </div>

        {/* Wins Leader */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Most Wins</span>
          </div>
          {winsLeader ? (
            <div className="flex items-center gap-2">
              <Avatar
                src={winsLeader.image}
                alt={winsLeader.name}
                fallback={winsLeader.name.charAt(0)}
                size="sm"
              />
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {winsLeader.wins} wins
              </span>
            </div>
          ) : (
            <span className="text-sm text-text-secondary">No leader yet</span>
          )}
        </div>

        {/* User's own stats */}
        {currentUserId && currentWeekStats && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-text-secondary mb-2">Your progress this week:</p>
            <div className="flex justify-between text-sm">
              <span className="text-green-600 dark:text-green-400">
                {currentWeekStats.elo > 0 ? `+${currentWeekStats.elo}` : currentWeekStats.elo} ELO
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                {currentWeekStats.wins} wins
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
