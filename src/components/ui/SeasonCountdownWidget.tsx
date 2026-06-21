'use client';

import { useState, useEffect } from 'react';
import { Clock, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface Season {
  id: string;
  name: string;
  endDate: string;
  isActive: boolean;
}

interface SeasonCountdownWidgetProps {
  compact?: boolean;
}

/**
 * Season Countdown Widget - Shows time until season ends
 */
export function SeasonCountdownWidget({ compact = false }: SeasonCountdownWidgetProps) {
  const [season, setSeason] = useState<Season | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSeason() {
      try {
        const res = await fetch('/api/seasons');
        if (res.ok) {
          const data = await res.json();
          // Get the active season with the earliest end date
          const activeSeasons = data.activeSeasons || [];
          if (activeSeasons.length > 0) {
            // Sort by end date and get the soonest one
            const soonest = activeSeasons.sort(
              (a: Season, b: Season) => 
                new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
            )[0];
            setSeason(soonest);
          }
        }
      } catch (e) {
        console.error('Failed to fetch season:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSeason();
  }, []);

  useEffect(() => {
    if (!season) return;

    function calculateTimeLeft() {
      const endTime = season ? new Date(season.endDate).getTime() : 0;
      const difference = endTime - new Date().getTime();
      
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [season]);

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!season) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-text-secondary">
          <Trophy className="h-5 w-5" />
          <span className="text-sm">No active season</span>
        </div>
      </Card>
    );
  }

  const isUrgent = timeLeft.days <= 3;

  if (compact) {
    return (
      <div className={`flex items-center gap-1 text-sm ${isUrgent ? 'text-red-500' : 'text-text-secondary'}`}>
        <Clock className="h-4 w-4" />
        <span>
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    );
  }

  return (
    <Card className={`p-4 ${isUrgent ? 'border-red-300 dark:border-red-700' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold">{season.name}</span>
        </div>
        <span className="text-xs text-text-secondary">
          {isUrgent ? 'Ending soon!' : 'Season ends in'}
        </span>
      </div>

      <div className={`grid grid-cols-4 gap-2 text-center ${isUrgent ? 'text-red-500' : ''}`}>
        <div className="bg-bg-secondary rounded-lg p-2">
          <div className="text-2xl font-bold">{timeLeft.days}</div>
          <div className="text-xs text-text-secondary">Days</div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-2">
          <div className="text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-xs text-text-secondary">Hours</div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-2">
          <div className="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-xs text-text-secondary">Mins</div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-2">
          <div className="text-2xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-xs text-text-secondary">Secs</div>
        </div>
      </div>
    </Card>
  );
}
