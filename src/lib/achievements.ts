/**
 * Achievement System
 * Defines achievements, checks for unlocks, and handles award logic
 */

export interface AchievementDef {
  slug: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  category: 'match' | 'streak' | 'elo' | 'special' | 'season';
}

/** All achievement definitions */
export const ACHIEVEMENTS: AchievementDef[] = [
  // Match-based achievements
  {
    slug: 'first_blood',
    name: 'First Blood',
    description: 'Win your first match',
    icon: '⚔️',
    tier: 'bronze',
    category: 'match',
  },
  {
    slug: 'getting_started',
    name: 'Getting Started',
    description: 'Complete your first 10 matches',
    icon: '👋',
    tier: 'bronze',
    category: 'match',
  },
  {
    slug: 'century_club',
    name: 'Century Club',
    description: 'Complete 100 total matches',
    icon: '💯',
    tier: 'silver',
    category: 'match',
  },
  {
    slug: 'five_hundred',
    name: 'Five Hundred',
    description: 'Complete 500 matches',
    icon: '🎯',
    tier: 'gold',
    category: 'match',
  },
  {
    slug: 'thousand_matches',
    name: 'Dedicated',
    description: 'Complete 1,000 matches',
    icon: '🏅',
    tier: 'platinum',
    category: 'match',
  },

  // Win-based achievements
  {
    slug: 'centurion',
    name: 'Centurion',
    description: 'Reach 100 wins',
    icon: '🏆',
    tier: 'silver',
    category: 'match',
  },
  {
    slug: 'five_hundred_wins',
    name: 'Half K Hero',
    description: 'Reach 500 wins',
    icon: '⚡',
    tier: 'gold',
    category: 'match',
  },
  {
    slug: 'thousand_wins',
    name: 'Champion',
    description: 'Reach 1,000 wins',
    icon: '👑',
    tier: 'platinum',
    category: 'match',
  },

  // Streak achievements
  {
    slug: 'hot_streak',
    name: 'Hot Streak',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    tier: 'bronze',
    category: 'streak',
  },
  {
    slug: 'blazing',
    name: 'Blazing',
    description: 'Maintain a 30-day streak',
    icon: '💥',
    tier: 'silver',
    category: 'streak',
  },
  {
    slug: 'unstoppable',
    name: 'Unstoppable',
    description: 'Maintain a 90-day streak',
    icon: '⚡',
    tier: 'gold',
    category: 'streak',
  },
  {
    slug: 'legendary_streak',
    name: 'Legendary Streak',
    description: 'Maintain a 365-day streak',
    icon: '🌟',
    tier: 'platinum',
    category: 'streak',
  },

  // ELO achievements
  {
    slug: 'goliath_killer',
    name: 'Goliath Killer',
    description: 'Beat someone 200+ ELO above you',
    icon: '👊',
    tier: 'gold',
    category: 'elo',
  },
  {
    slug: 'rising_star',
    name: 'Rising Star',
    description: 'Reach Gold tier (1300 ELO)',
    icon: '⭐',
    tier: 'silver',
    category: 'elo',
  },
  {
    slug: 'elite_player',
    name: 'Elite Player',
    description: 'Reach Platinum tier (1500 ELO)',
    icon: '💎',
    tier: 'gold',
    category: 'elo',
  },
  {
    slug: 'master',
    name: 'Master',
    description: 'Reach Master tier (1900 ELO)',
    icon: '⚡',
    tier: 'platinum',
    category: 'elo',
  },

  // Special achievements
  {
    slug: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Win after being down 5+ points',
    icon: '💪',
    tier: 'bronze',
    category: 'special',
  },
  {
    slug: 'dominant',
    name: 'Dominant',
    description: 'Win 11-0 (shutout)',
    icon: '🔱',
    tier: 'silver',
    category: 'special',
  },
  {
    slug: 'quick_draw',
    name: 'Quick Draw',
    description: 'Win a match in under 2 minutes',
    icon: '⚡',
    tier: 'bronze',
    category: 'special',
  },

  // Doubles achievements
  {
    slug: 'doubles_rookie',
    name: 'Doubles Rookie',
    description: 'Complete your first doubles match',
    icon: '🤝',
    tier: 'bronze',
    category: 'match',
  },
  {
    slug: 'doubles_master',
    name: 'Doubles Master',
    description: 'Win 50 doubles matches',
    icon: '🎾',
    tier: 'silver',
    category: 'match',
  },

  // Team achievements
  {
    slug: 'team_player',
    name: 'Team Player',
    description: 'Complete your first team season',
    icon: '👥',
    tier: 'bronze',
    category: 'season',
  },
  {
    slug: 'team_champion',
    name: 'Team Champion',
    description: 'Win a team season',
    icon: '🏅',
    tier: 'gold',
    category: 'season',
  },

  // Season achievements
  {
    slug: 'season_champion',
    name: 'Season Champion',
    description: 'Win a singles season',
    icon: '🏆',
    tier: 'gold',
    category: 'season',
  },
  {
    slug: 'season_king',
    name: 'Season King',
    description: 'Win 3 seasons',
    icon: '👑',
    tier: 'platinum',
    category: 'season',
  },
];

/** Get achievement definition by slug */
export function getAchievementDef(slug: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find(a => a.slug === slug);
}

/** Get all achievement slugs */
export function getAllAchievementSlugs(): string[] {
  return ACHIEVEMENTS.map(a => a.slug);
}

/** Get achievements by category */
export function getAchievementsByCategory(category: AchievementDef['category']): AchievementDef[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}

/** Get tier color class */
export function getTierColorClass(tier: AchievementDef['tier']): string {
  switch (tier) {
    case 'bronze':
      return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
    case 'silver':
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    case 'gold':
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
    case 'platinum':
      return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30';
  }
}

/** Types for achievement check results */
export interface MatchContext {
  userId: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  currentStreak: number;
  longestStreak: number;
  foreverElo: number;
  doublesMatchesPlayed?: number;
  doublesWins?: number;
  totalSinglesSeasonWins?: number;
  totalDoublesSeasonWins?: number;
  totalTeamSeasonWins?: number;
  opponentElo?: number;
  scoreDifference?: number;
  matchDuration?: number; // in seconds
}

/** Check which achievements should be unlocked based on current stats */
export function checkAchievements(ctx: MatchContext): string[] {
  const toUnlock: string[] = [];

  // First Blood - first win
  if (ctx.wins === 1) {
    toUnlock.push('first_blood');
  }

  // Getting Started - 10 matches
  if (ctx.matchesPlayed >= 10) {
    toUnlock.push('getting_started');
  }

  // Century Club - 100 matches
  if (ctx.matchesPlayed >= 100) {
    toUnlock.push('century_club');
  }

  // Five Hundred - 500 matches
  if (ctx.matchesPlayed >= 500) {
    toUnlock.push('five_hundred');
  }

  // Thousand Matches - 1000 matches
  if (ctx.matchesPlayed >= 1000) {
    toUnlock.push('thousand_matches');
  }

  // Centurion - 100 wins
  if (ctx.wins >= 100) {
    toUnlock.push('centurion');
  }

  // 500 wins
  if (ctx.wins >= 500) {
    toUnlock.push('five_hundred_wins');
  }

  // 1000 wins
  if (ctx.wins >= 1000) {
    toUnlock.push('thousand_wins');
  }

  // Hot Streak - 7 day streak
  if (ctx.currentStreak >= 7 || ctx.longestStreak >= 7) {
    toUnlock.push('hot_streak');
  }

  // Blazing - 30 day streak
  if (ctx.currentStreak >= 30 || ctx.longestStreak >= 30) {
    toUnlock.push('blazing');
  }

  // Unstoppable - 90 day streak
  if (ctx.currentStreak >= 90 || ctx.longestStreak >= 90) {
    toUnlock.push('unstoppable');
  }

  // Legendary Streak - 365 day streak
  if (ctx.currentStreak >= 365 || ctx.longestStreak >= 365) {
    toUnlock.push('legendary_streak');
  }

  // Rising Star - Gold tier (1300 ELO)
  if (ctx.foreverElo >= 1300) {
    toUnlock.push('rising_star');
  }

  // Elite Player - Platinum tier (1500 ELO)
  if (ctx.foreverElo >= 1500) {
    toUnlock.push('elite_player');
  }

  // Master - 1900 ELO
  if (ctx.foreverElo >= 1900) {
    toUnlock.push('master');
  }

  // Doubles achievements
  if ((ctx.doublesMatchesPlayed || 0) >= 1) {
    toUnlock.push('doubles_rookie');
  }
  if ((ctx.doublesWins || 0) >= 50) {
    toUnlock.push('doubles_master');
  }

  // Season achievements
  if ((ctx.totalTeamSeasonWins || 0) >= 1) {
    toUnlock.push('team_player');
  }
  if ((ctx.totalTeamSeasonWins || 0) >= 1) {
    toUnlock.push('team_champion');
  }
  if ((ctx.totalSinglesSeasonWins || 0) >= 1) {
    toUnlock.push('season_champion');
  }
  if ((ctx.totalSinglesSeasonWins || 0) >= 3) {
    toUnlock.push('season_king');
  }

  return toUnlock;
}

/** Check for special match-based achievements */
export function checkSpecialAchievements(
  ctx: MatchContext,
  matchWon: boolean,
  wasDown5Points: boolean,
  wasShutout: boolean,
  durationUnder2Min: boolean
): string[] {
  const toUnlock: string[] = [];

  // Goliath Killer - beat someone 200+ ELO above
  if (matchWon && ctx.opponentElo && ctx.foreverElo && 
      ctx.opponentElo >= ctx.foreverElo + 200) {
    toUnlock.push('goliath_killer');
  }

  // Comeback Kid - win after being down 5+ points
  if (matchWon && wasDown5Points) {
    toUnlock.push('comeback_kid');
  }

  // Dominant - 11-0 shutout
  if (matchWon && wasShutout) {
    toUnlock.push('dominant');
  }

  // Quick Draw - win in under 2 minutes
  if (matchWon && durationUnder2Min) {
    toUnlock.push('quick_draw');
  }

  return toUnlock;
}
