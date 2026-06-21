/**
 * ELO Rating System Implementation for PingElo
 * 
 * This module implements an enhanced ELO rating system optimized for
 * small recreational ping pong leagues (10-50 players) with frequent play.
 * 
 * Key Features:
 * - Dynamic K-factor for faster convergence with new players
 * - Score margin multiplier for casual matches
 * - Doubles support with team-based ELO calculations
 * - Doubles support with team-based ELO calculations
 */

// ============================================
// Constants
// ============================================

/** Default ELO for new players */
export const DEFAULT_ELO = 1000;

/** Maximum possible ELO change for a single match */
export const MAX_ELO_CHANGE = 64;

/** K-factor thresholds based on games played */
export const K_FACTOR_THRESHOLDS = {
  NEW_PLAYER: 10,      // 0-10 games
  ADJUSTING: 30,       // 11-30 games
  ESTABLISHED: 100,   // 31-100 games
  // 100+ games uses veteran K-factor
} as const;

/** K-factor values */
export const K_FACTORS = {
  NEW_PLAYER: 64,     // Rapid adjustment for new players
  ADJUSTING: 48,      // Still adjusting quickly
  ESTABLISHED: 32,    // Stable, established players
  VETERAN: 24,        // Veterans - slow to change
} as const;

/** Score margin multiplier thresholds */
export const MARGIN_THRESHOLDS = {
  CLOSE: 4,           // 1-4 points
  CLEAR: 9,           // 5-9 points
  // 10+ points is dominance
} as const;

/** Margin multipliers */
export const MARGIN_MULTIPLIERS = {
  CLOSE: 1.0,         // Close games
  CLEAR: 1.25,        // Clear win
  DOMINANCE: 1.5,     // Dominance
} as const;

/** Activity settings */
export const ACTIVITY = {
  /** Minimum matches per week to qualify for activity bonus */
  MATCHES_PER_WEEK: 2,
  /** ELO bonus for active players */
  BONUS: 5,
  /** Weeks of inactivity before showing "rusty" badge */
  RUSTY_WEEKS: 4,
} as const;

/** Tournament payout percentages */
export const TOURNAMENT_PAYOUT = {
  FIRST: 0.50,        // 50% to 1st place
  SECOND: 0.35,       // 35% to 2nd place
  THIRD: 0.15,        // 15% to 3rd place
} as const;

/** Season champion bonus percentage */
export const SEASON_CHAMPION_BONUS = 0.10; // 10% of season gains

// ============================================
// Types
// ============================================

export type MatchType = 'SINGLES' | 'DOUBLES';

export interface EloRating {
  elo: number;
  gamesPlayed: number;
}

export interface EloChangeResult {
  player1Change: number;
  player2Change: number;
  player1NewElo: number;
  player2NewElo: number;
  player1Expected: number;
  player2Expected: number;
  marginMultiplier: number;
  explanation: EloExplanation;
}

export interface DoublesEloResult {
  team1Change: number;
  team2Change: number;
  team1NewElo: number;
  team2NewElo: number;
  individualChanges: {
    team1Player1: number;
    team1Player2: number;
    team2Player1: number;
    team2Player2: number;
  };
}

export interface EloExplanation {
  kFactor1: number;
  kFactor2: number;
  expected1: number;
  expected2: number;
  actual1: number;
  actual2: number;
  marginMultiplier: number;
  isTournament: boolean;
  calculation: string;
}

export interface MatchResult {
  player1Score: number;
  player2Score: number;
  winnerId: "player1" | "player2";
}

// ============================================
// K-Factor Calculation
// ============================================

/**
 * Gets the K-factor based on number of games played
 * New players get higher K-factor for faster convergence
 */
export function getKFactor(gamesPlayed: number): number {
  if (gamesPlayed < K_FACTOR_THRESHOLDS.NEW_PLAYER) {
    return K_FACTORS.NEW_PLAYER;
  }
  if (gamesPlayed < K_FACTOR_THRESHOLDS.ADJUSTING) {
    return K_FACTORS.ADJUSTING;
  }
  if (gamesPlayed < K_FACTOR_THRESHOLDS.ESTABLISHED) {
    return K_FACTORS.ESTABLISHED;
  }
  return K_FACTORS.VETERAN;
}

/**
 * Gets the K-factor for doubles based on total doubles games played
 * Both teammates use their combined average games played
 */
export function getDoublesKFactor(player1Games: number, player2Games: number): number {
  const averageGames = Math.floor((player1Games + player2Games) / 2);
  return getKFactor(averageGames);
}

/**
 * Gets the K-factor for a team based on team matches played
 * Teams track their own ELO history separate from individual players
 */
export function getTeamKFactor(gamesPlayed: number): number {
  if (gamesPlayed < K_FACTOR_THRESHOLDS.NEW_PLAYER) {
    return K_FACTORS.NEW_PLAYER;
  }
  if (gamesPlayed < K_FACTOR_THRESHOLDS.ADJUSTING) {
    return K_FACTORS.ADJUSTING;
  }
  if (gamesPlayed < K_FACTOR_THRESHOLDS.ESTABLISHED) {
    return K_FACTORS.ESTABLISHED;
  }
  return K_FACTORS.VETERAN;
}

/**
 * Gets a human-readable label for the K-factor tier
 */
export function getKFactorLabel(gamesPlayed: number): string {
  if (gamesPlayed < K_FACTOR_THRESHOLDS.NEW_PLAYER) {
    return "New Player (64)";
  }
  if (gamesPlayed < K_FACTOR_THRESHOLDS.ADJUSTING) {
    return "Still Adjusting (48)";
  }
  if (gamesPlayed < K_FACTOR_THRESHOLDS.ESTABLISHED) {
    return "Established (32)";
  }
  return "Veteran (24)";
}

// ============================================
// Seasonal K-Factor Calculation  
// ============================================

/** Seasonal K-factor thresholds - same as lifetime thresholds */
export const SEASONAL_K_FACTOR_THRESHOLDS = {
  NEW_PLAYER: 10,      // 0-10 season games (same as lifetime)
  ADJUSTING: 30,       // 11-30 season games (same as lifetime)
  ESTABLISHED: 100,   // 31-100 season games (same as lifetime)
  // 100+ season games uses veteran K-factor
} as const;

/** Seasonal K-factor values (same as lifetime) */
export const SEASONAL_K_FACTORS = {
  NEW_PLAYER: 64,      // Same as lifetime new player
  ADJUSTING: 48,       // Same as lifetime adjusting
  ESTABLISHED: 32,     // Same as lifetime established
  VETERAN: 24,         // Same as lifetime veteran
} as const;

/**
 * Gets the K-factor based on season-specific games played
 * Lower thresholds than lifetime since season resets affect experience
 */
export function getSeasonalKFactor(seasonMatchesPlayed: number): number {
  if (seasonMatchesPlayed < SEASONAL_K_FACTOR_THRESHOLDS.NEW_PLAYER) {
    return SEASONAL_K_FACTORS.NEW_PLAYER;
  }
  if (seasonMatchesPlayed < SEASONAL_K_FACTOR_THRESHOLDS.ADJUSTING) {
    return SEASONAL_K_FACTORS.ADJUSTING;
  }
  if (seasonMatchesPlayed < SEASONAL_K_FACTOR_THRESHOLDS.ESTABLISHED) {
    return SEASONAL_K_FACTORS.ESTABLISHED;
  }
  return SEASONAL_K_FACTORS.VETERAN;
}

/**
 * Gets the K-factor for doubles based on season matches played
 * Uses average of both players' season matches
 */
export function getSeasonalDoublesKFactor(player1SeasonMatches: number, player2SeasonMatches: number): number {
  const averageSeasonMatches = Math.floor((player1SeasonMatches + player2SeasonMatches) / 2);
  return getSeasonalKFactor(averageSeasonMatches);
}

/**
 * Gets a human-readable label for the seasonal K-factor tier
 */
export function getSeasonalKFactorLabel(seasonMatchesPlayed: number): string {
  if (seasonMatchesPlayed < SEASONAL_K_FACTOR_THRESHOLDS.NEW_PLAYER) {
    return `Season New (${SEASONAL_K_FACTORS.NEW_PLAYER})`;
  }
  if (seasonMatchesPlayed < SEASONAL_K_FACTOR_THRESHOLDS.ADJUSTING) {
    return `Season Adjusting (${SEASONAL_K_FACTORS.ADJUSTING})`;
  }
  if (seasonMatchesPlayed < SEASONAL_K_FACTOR_THRESHOLDS.ESTABLISHED) {
    return `Season Established (${SEASONAL_K_FACTORS.ESTABLISHED})`;
  }
  return `Season Veteran (${SEASONAL_K_FACTORS.VETERAN})`;
}

// ============================================
// Expected Score Calculation
// ============================================

/**
 * Calculates expected score for a player based on ELO difference
 * Uses the standard ELO expected score formula
 */
export function getExpectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

/**
 * Calculates team ELO for doubles as the average of both players' doubles ELO
 */
export function getTeamElo(player1Elo: number, player2Elo: number): number {
  return Math.round((player1Elo + player2Elo) / 2);
}

// ============================================
// Margin Multiplier
// ============================================

/**
 * Calculates score margin multiplier for casual matches
 * Tournament matches always use 1.0x multiplier
 */
export function getMarginMultiplier(
  winnerScore: number,
  loserScore: number,
  isTournament: boolean = false
): number {
  // Margin multiplier applies to ALL matches including tournaments
  const margin = Math.abs(winnerScore - loserScore);

  if (margin <= MARGIN_THRESHOLDS.CLOSE) {
    return MARGIN_MULTIPLIERS.CLOSE;
  }
  if (margin <= MARGIN_THRESHOLDS.CLEAR) {
    return MARGIN_MULTIPLIERS.CLEAR;
  }
  return MARGIN_MULTIPLIERS.DOMINANCE;
}

/**
 * Gets a label for the margin multiplier tier
 */
export function getMarginLabel(margin: number): string {
  if (margin <= MARGIN_THRESHOLDS.CLOSE) {
    return "Close game (1.0x)";
  }
  if (margin <= MARGIN_THRESHOLDS.CLEAR) {
    return "Clear win (1.25x)";
  }
  return "Dominance (1.5x)";
}

// ============================================
// Singles ELO Calculation
// ============================================

/**
 * Calculates ELO changes for a match
 * 
 * @param player1Elo - Current ELO of player 1
 * @param player2Elo - Current ELO of player 2
 * @param player1GamesPlayed - Number of games player 1 has played
 * @param player2GamesPlayed - Number of games player 2 has played
 * @param matchResult - Score and winner information
 * @param isTournament - Whether this is a tournament match
 * @returns Detailed ELO change results
 */
export function calculateEloChange(
  player1Elo: number,
  player2Elo: number,
  player1GamesPlayed: number,
  player2GamesPlayed: number,
  matchResult: MatchResult,
  isTournament: boolean = false
): EloChangeResult {
  // Get K-factors for each player
  const k1 = getKFactor(player1GamesPlayed);
  const k2 = getKFactor(player2GamesPlayed);

  // Calculate expected scores
  const expected1 = getExpectedScore(player1Elo, player2Elo);
  const expected2 = 1 - expected1; // Symmetric

  // Determine actual result (1 for win, 0 for loss)
  const actual1 = matchResult.winnerId === "player1" ? 1 : 0;
  const actual2 = 1 - actual1; // Symmetric

  // Calculate margin multiplier
  const marginMultiplier = getMarginMultiplier(
    matchResult.player1Score,
    matchResult.player2Score,
    isTournament
  );

  // Calculate raw ELO changes
  const rawChange1 = k1 * (actual1 - expected1);
  const rawChange2 = k2 * (actual2 - expected2);

  // Apply margin multiplier to the winner's gain
  const multiplierEffect = marginMultiplier;
  const player1Change = Math.round(rawChange1 * multiplierEffect);
  const player2Change = Math.round(rawChange2 * multiplierEffect);

  // Calculate new ELOs
  const player1NewElo = player1Elo + player1Change;
  const player2NewElo = player2Elo + player2Change;

  // Build explanation
  const explanation: EloExplanation = {
    kFactor1: k1,
    kFactor2: k2,
    expected1,
    expected2,
    actual1,
    actual2,
    marginMultiplier,
    isTournament,
    calculation: `${k1} × (${actual1} - ${expected1.toFixed(2)}) × ${multiplierEffect} = ${player1Change}`,
  };

  return {
    player1Change,
    player2Change,
    player1NewElo,
    player2NewElo,
    player1Expected: expected1,
    player2Expected: expected2,
    marginMultiplier,
    explanation,
  };
}

/**
 * Simpler version for just getting the change values
 */
export function getEloChange(
  player1Elo: number,
  player2Elo: number,
  player1GamesPlayed: number,
  player2GamesPlayed: number,
  player1Won: boolean,
  winnerScore: number,
  loserScore: number,
  isTournament: boolean = false
): { winnerChange: number; loserChange: number } {
  const result = calculateEloChange(
    player1Elo,
    player2Elo,
    player1GamesPlayed,
    player2GamesPlayed,
    {
      player1Score: player1Won ? winnerScore : loserScore,
      player2Score: player1Won ? loserScore : winnerScore,
      winnerId: "player1",
    },
    isTournament
  );

  return {
    winnerChange: result.player1Change,
    loserChange: result.player2Change,
  };
}

// ============================================
// Doubles ELO Calculation
// ============================================

/**
 * Calculates ELO changes for a doubles match
 * 
 * In doubles, each player has individual ELO but we calculate
 * the team ELO as the average of both players' doubles ELO.
 * Both teammates share the same team ELO change.
 * 
 * @param team1Player1Elo - Doubles ELO of Team 1 Player 1
 * @param team1Player2Elo - Doubles ELO of Team 1 Player 2
 * @param team2Player1Elo - Doubles ELO of Team 2 Player 1
 * @param team2Player2Elo - Doubles ELO of Team 2 Player 2
 * @param team1GamesPlayed - Total doubles games played by Team 1 (avg of both)
 * @param team2GamesPlayed - Total doubles games played by Team 2 (avg of both)
 * @param team1Won - Whether Team 1 won the match
 * @param winnerScore - Score of the winning team
 * @param loserScore - Score of the losing team
 * @param isTournament - Whether this is a tournament match
 * @returns Doubles ELO change results including individual changes
 */
export function calculateDoublesEloChange(
  team1Player1Elo: number,
  team1Player2Elo: number,
  team2Player1Elo: number,
  team2Player2Elo: number,
  team1Player1Games: number,
  team1Player2Games: number,
  team2Player1Games: number,
  team2Player2Games: number,
  team1Won: boolean,
  winnerScore: number,
  loserScore: number,
  isTournament: boolean = false
): DoublesEloResult {
  // Calculate team ELOs (average of both players)
  const team1Elo = getTeamElo(team1Player1Elo, team1Player2Elo);
  const team2Elo = getTeamElo(team2Player1Elo, team2Player2Elo);

  // Get K-factors based on average games played for each team
  const team1KFactor = getDoublesKFactor(team1Player1Games, team1Player2Games);
  const team2KFactor = getDoublesKFactor(team2Player1Games, team2Player2Games);

  // Calculate expected scores
  const expected1 = getExpectedScore(team1Elo, team2Elo);
  const expected2 = 1 - expected1;

  // Determine actual result
  const actual1 = team1Won ? 1 : 0;
  const actual2 = 1 - actual1;

  // Calculate margin multiplier
  const marginMultiplier = getMarginMultiplier(winnerScore, loserScore, isTournament);

  // Calculate raw ELO changes using team K-factors
  const rawChange1 = team1KFactor * (actual1 - expected1);
  const rawChange2 = team2KFactor * (actual2 - expected2);

  // Apply margin multiplier
  const team1Change = Math.round(rawChange1 * marginMultiplier);
  const team2Change = Math.round(rawChange2 * marginMultiplier);

  // Calculate new team ELOs
  const team1NewElo = team1Elo + team1Change;
  const team2NewElo = team2Elo + team2Change;

  // Calculate individual ELO changes
  // Each player's change is based on their own K-factor but uses team result
  // This allows individuals to gain/lose slightly different amounts
  // based on their experience level while maintaining team integrity
  
  const k1 = getKFactor(team1Player1Games);
  const k2 = getKFactor(team1Player2Games);
  const k3 = getKFactor(team2Player1Games);
  const k4 = getKFactor(team2Player2Games);

  // Use weighted average for individual changes
  // More experienced players have slightly less change
  const totalTeam1Games = team1Player1Games + team1Player2Games;
  const totalTeam2Games = team2Player1Games + team2Player2Games;

  let team1Player1Change: number;
  let team1Player2Change: number;
  let team2Player1Change: number;
  let team2Player2Change: number;

  if (team1Won) {
    // Team 1 won - they gain, Team 2 loses
    // Weight changes by inverse of games played (less experienced = more change)
    const team1Weight1 = totalTeam1Games > 0 ? (totalTeam1Games - team1Player1Games) / totalTeam1Games : 0.5;
    const team1Weight2 = totalTeam1Games > 0 ? (totalTeam1Games - team1Player2Games) / totalTeam1Games : 0.5;
    const team2Weight1 = totalTeam2Games > 0 ? (totalTeam2Games - team2Player1Games) / totalTeam2Games : 0.5;
    const team2Weight2 = totalTeam2Games > 0 ? (totalTeam2Games - team2Player2Games) / totalTeam2Games : 0.5;

    // Apply same team change with minor individual adjustments
    team1Player1Change = Math.round(team1Change * (1 + (team1Weight1 - 0.5) * 0.1));
    team1Player2Change = Math.round(team1Change * (1 + (team1Weight2 - 0.5) * 0.1));
    team2Player1Change = Math.round(team2Change * (1 + (team2Weight1 - 0.5) * 0.1));
    team2Player2Change = Math.round(team2Change * (1 + (team2Weight2 - 0.5) * 0.1));
  } else {
    // Team 2 won - they gain, Team 1 loses
    const team1Weight1 = totalTeam1Games > 0 ? team1Player1Games / totalTeam1Games : 0.5;
    const team1Weight2 = totalTeam1Games > 0 ? team1Player2Games / totalTeam1Games : 0.5;
    const team2Weight1 = totalTeam2Games > 0 ? team2Player1Games / totalTeam2Games : 0.5;
    const team2Weight2 = totalTeam2Games > 0 ? team2Player2Games / totalTeam2Games : 0.5;

    team1Player1Change = Math.round(team1Change * (1 + (team1Weight1 - 0.5) * 0.1));
    team1Player2Change = Math.round(team1Change * (1 + (team1Weight2 - 0.5) * 0.1));
    team2Player1Change = Math.round(team2Change * (1 + (team2Weight1 - 0.5) * 0.1));
    team2Player2Change = Math.round(team2Change * (1 + (team2Weight2 - 0.5) * 0.1));
  }

  return {
    team1Change,
    team2Change,
    team1NewElo,
    team2NewElo,
    individualChanges: {
      team1Player1: team1Player1Change,
      team1Player2: team1Player2Change,
      team2Player1: team2Player1Change,
      team2Player2: team2Player2Change,
    },
  };
}

// ============================================
// Activity Tracking
// ============================================

/**
 * Checks if a player qualifies for activity bonus
 * Based on playing 2+ matches per week
 */
export function checkActivityBonus(
  matchesThisWeek: number
): { qualified: boolean; bonus: number } {
  return {
    qualified: matchesThisWeek >= ACTIVITY.MATCHES_PER_WEEK,
    bonus: matchesThisWeek >= ACTIVITY.MATCHES_PER_WEEK ? ACTIVITY.BONUS : 0,
  };
}

/**
 * Checks if a player should be marked as "rusty"
 * Based on 4+ weeks of inactivity
 */
export function checkRustyStatus(
  lastMatchDate: Date | null
): { isRusty: boolean; weeksSinceLastMatch: number | null } {
  if (!lastMatchDate) {
    return { isRusty: false, weeksSinceLastMatch: null };
  }

  const now = new Date();
  const weeksSince = Math.floor(
    (now.getTime() - lastMatchDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );

  return {
    isRusty: weeksSince >= ACTIVITY.RUSTY_WEEKS,
    weeksSinceLastMatch: weeksSince,
  };
}

// ============================================
// Tournament Payout Calculations
// ============================================

/**
 * Calculates tournament prize distribution
 * Based on multi-place payout structure
 */
export function calculateTournamentPayout(
  totalPrizePool: number,
  placements: number[]
): Map<number, number> {
  const payouts = new Map<number, number>();

  if (placements.length === 0 || totalPrizePool === 0) {
    return payouts;
  }

  // Sort placements (lower is better)
  const sortedPlacements = [...placements].sort((a, b) => a - b);

  // Calculate payout for each placement
  for (const placement of sortedPlacements) {
    let payout: number;

    switch (placement) {
      case 1:
        payout = Math.floor(totalPrizePool * TOURNAMENT_PAYOUT.FIRST);
        break;
      case 2:
        payout = Math.floor(totalPrizePool * TOURNAMENT_PAYOUT.SECOND);
        break;
      case 3:
        payout = Math.floor(totalPrizePool * TOURNAMENT_PAYOUT.THIRD);
        break;
      default:
        payout = 0;
    }

    payouts.set(placement, payout);
  }

  return payouts;
}

/**
 * Tournament Entry Fee Structure
 * ===============================
 * Singles: Each player pays based on their own ELO
 * Doubles: Each player pays based on their individual ELO (not team total)
 * 
 * Fee Tiers:
 * - Below 800 ELO: 0 ELO (free)
 * - 800-999 ELO: 10 ELO per player
 * - 1000-1199 ELO: 20 ELO per player
 * - 1200+ ELO: 50 ELO per player
 * 
 * Examples (Doubles):
 * - 1200 + 800 = 50 + 10 = 60 ELO total entry fee
 * - 1000 + 1000 = 20 + 20 = 40 ELO total entry fee
 * - 750 + 750 = 0 + 0 = 0 ELO (free for both)
 */
export function calculateEntryFee(playerElo: number): number {
  if (playerElo < 800) {
    return 0; // Free entry for lower-ranked players
  }
  if (playerElo < 1000) {
    return 10;
  }
  if (playerElo < 1200) {
    return 20;
  }
  return 50;
}

/**
 * Gets the ELO tier label for a player

/**
 * Calculates the doubles entry fee for a team
 * Both players pay the same fee based on the team average ELO
 */
export function calculateDoublesEntryFee(player1Elo: number, player2Elo: number): number {
  const teamAverage = Math.floor((player1Elo + player2Elo) / 2);
  return calculateEntryFee(teamAverage);
}

/**
 * Gets the ELO tier label for a player
 */
export function getEloTierLabel(elo: number): string {
  // Returns the skill tier name for display
  const tier = getPlayerTier(elo);
  return tier.name;
}

// ============================================
// Season Calculations
// ============================================

/**
 * Calculates the season champion bonus
 * 10% of season gains added to forever ELO when season ends
 */
export function calculateSeasonChampionBonus(seasonGains: number): number {
  return Math.floor(seasonGains * SEASON_CHAMPION_BONUS);
}

/**
 * Calculates house ELO injection for tournaments
 * Platform adds ELO to each tournament prize pool
 */
export const TOURNAMENT_HOUSE_INJECTION = 50; // Default house ELO injection for tournaments

/**
 * Prize distribution percentages for tournament completion
 * 1st: 50%, 2nd: 35%, 3rd: 15%
 */
export const TOURNAMENT_PRIZE_DISTRIBUTION = {
  first: 0.50,
  second: 0.35,
  third: 0.15,
} as const;

/**
 * Gets the total prize pool for a tournament
 */
export function getTournamentPrizePool(entryFees: number[]): number {
  const totalEntryFees = entryFees.reduce((sum, fee) => sum + fee, 0);
  return totalEntryFees + TOURNAMENT_HOUSE_INJECTION;
}

// ============================================
// ELO Range Helpers
// ============================================

/**
 * Determines ELO tier color for UI display
 */
export function getEloTierColor(elo: number): string {
  if (elo < 800) return "text-gray-400";  // Gray
  if (elo < 1000) return "text-green-500"; // Green
  if (elo < 1200) return "text-blue-500"; // Blue
  if (elo < 1400) return "text-purple-500"; // Purple
  return "text-yellow-500"; // Gold for 1400+
}

/**
 * Determines ELO tier badge color for UI display
 */
export function getEloTierBadgeColor(elo: number): string {
  if (elo < 800) return "bg-gray-100 text-gray-700";
  if (elo < 1000) return "bg-green-100 text-green-700";
  if (elo < 1200) return "bg-blue-100 text-blue-700";
  if (elo < 1400) return "bg-purple-100 text-purple-700";
  return "bg-yellow-100 text-yellow-700";
}

// ============================================
// Tier Milestone System
// ============================================

/** ELO tier milestones for announcements */
export const ELO_TIERS = [
  { name: "Rookie", min: 0, emoji: "🌱", color: "gray" },
  { name: "Bronze", min: 800, emoji: "🥉", color: "orange" },
  { name: "Silver", min: 1100, emoji: "🥈", color: "gray" },
  { name: "Gold", min: 1300, emoji: "🥇", color: "yellow" },
  { name: "Platinum", min: 1500, emoji: "💎", color: "cyan" },
  { name: "Diamond", min: 1700, emoji: "💠", color: "blue" },
  { name: "Master", min: 1900, emoji: "⚡", color: "purple" },
  { name: "Grandmaster", min: 2100, emoji: "👑", color: "red" },
  { name: "Legend", min: 2300, emoji: "🏆", color: "yellow" },
] as const;

/** Get player's current tier info */
export function getPlayerTier(elo: number): { name: string; min: number; emoji: string; color: string } {
  let tier = { name: "Rookie", min: 0, emoji: "🌱", color: "gray" };
  for (const t of ELO_TIERS) {
    if (elo >= t.min) tier = { ...t };
  }
  return tier;
}

/** Get tier announcement message when crossing a tier */
export function getTierAnnouncementMessage(previousElo: number, newElo: number): string | null {
  const crossedTier = checkTierCrossing(previousElo, newElo);
  if (!crossedTier) return null;
  
  if (crossedTier.min >= 2300) {
    return `🏆 LEGENDARY! You've reached ${crossedTier.name}!`;
  } else if (crossedTier.min >= 1900) {
    return `👑 ${crossedTier.name}! Elite status achieved!`;
  } else if (crossedTier.min >= 1500) {
    return `💎 ${crossedTier.name}! Rising through the ranks!`;
  }
  return `${crossedTier.emoji} ${crossedTier.name}! You've been promoted!`;
}

/** Check if ELO crosses a tier threshold */
export function checkTierCrossing(previousElo: number, newElo: number): { name: string; min: number; emoji: string; color: string } | null {
  const prevTier = getPlayerTier(previousElo);
  const newTier = getPlayerTier(newElo);
  return prevTier.name !== newTier.name ? newTier : null;
}

// ============================================
// Ranking Helpers
// ============================================

/**
 * Calculates percentile rank for a player
 */
export function calculatePercentile(
  playerElo: number,
  allElos: number[]
): number {
  const sorted = [...allElos].sort((a, b) => a - b);
  const rank = sorted.filter((elo) => elo < playerElo).length;
  return Math.round((rank / sorted.length) * 100);
}

/**
 * Formats ELO change with sign for display
 */
export function formatEloChange(change: number): string {
  if (change > 0) return `+${change}`;
  if (change < 0) return `${change}`;
  return "0";
}

// ============================================
// Activity Streak System
// ============================================

/** Streak bonus configuration */
export const STREAK_CONFIG = {
  /** Days without play to reset streak */
  STREAK_GRACE_PERIOD: 2, // Can miss 2 days before losing streak
  /** Tier thresholds for streak bonus (days) */
  TIER_THRESHOLDS: {
    TIER1: 3,   // 3+ days: +1/match, max 5/day
    TIER2: 7,   // 7+ days: +2/match, max 10/day
    TIER3: 14,  // 14+ days: +3/match, max 15/day
    TIER4: 30,  // 30+ days: +5/match, max 25/day
  },
  /** Streak bonus per match per tier */
  TIER_BONUS: {
    TIER1: 1,  // +1 ELO per match
    TIER2: 2,  // +2 ELO per match
    TIER3: 3,  // +3 ELO per match
    TIER4: 5,  // +5 ELO per match
  },
  /** Max daily streak bonus per tier */
  TIER_MAX_DAILY: {
    TIER1: 5,   // Max 5 ELO per day
    TIER2: 10,  // Max 10 ELO per day
    TIER3: 15,  // Max 15 ELO per day
    TIER4: 25,  // Max 25 ELO per day
  },
} as const;

/** Milestone streaks that trigger celebrations */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365] as const;

/** Get streak milestone message */
export function getStreakMilestoneMessage(streak: number): string {
  if (streak === 3) return "🔥 3-Day Streak! You're heating up!";
  if (streak === 7) return "🔥🔥 1-Week Streak! On fire!";
  if (streak === 14) return "🔥🔥🔥 2-Week Streak! Unstoppable!";
  if (streak === 30) return "💥 1-Month Streak! Legendary!";
  if (streak === 60) return "⚡ 2-Month Streak! Machine!";
  if (streak === 90) return "🌟 3-Month Streak! GOAT status!";
  if (streak === 180) return "👑 6-Month Streak! Hall of Fame!";
  if (streak === 365) return "🏆 1-YEAR STREAK! Absolute legend!";
  return `🔥 ${streak}-Day Streak!`;
}

/**
 * Calculates new streak values after a match
 * Returns milestoneHit if player just hit a streak milestone
 */
export function calculateStreak(
  lastMatchDate: Date | null,
  currentStreak: number,
  longestStreak: number,
  today: Date = new Date()
): { newStreak: number; newLongestStreak: number; hasStreakBonus: boolean; milestoneHit: number | null } {
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (!lastMatchDate) {
    // First match ever
    const newStreak = 1;
    const newLongestStreak = Math.max(1, longestStreak);
    const milestoneHit = STREAK_MILESTONES.includes(newStreak as typeof STREAK_MILESTONES[number]) ? newStreak : null;
    return { newStreak, newLongestStreak, hasStreakBonus: false, milestoneHit };
  }

  const lastMatchStart = new Date(lastMatchDate);
  lastMatchStart.setHours(0, 0, 0, 0);

  // Check if already played today
  if (lastMatchStart.getTime() === todayStart.getTime()) {
    // Already played today, just return current state
    const hasStreakBonus = currentStreak >= STREAK_CONFIG.TIER_THRESHOLDS.TIER1;
    return { newStreak: currentStreak, newLongestStreak: longestStreak, hasStreakBonus, milestoneHit: null };
  }

  // Calculate days since last match
  const daysDiff = Math.floor((todayStart.getTime() - lastMatchStart.getTime()) / (1000 * 60 * 60 * 24));

  let newStreak: number;
  if (daysDiff === 0) {
    // Same day - shouldn't happen if checked above
    newStreak = currentStreak;
  } else if (daysDiff === 1) {
    // Consecutive day
    newStreak = currentStreak + 1;
  } else if (daysDiff <= STREAK_CONFIG.STREAK_GRACE_PERIOD + 1) {
    // Within grace period - streak continues but we "missed" some days
    newStreak = currentStreak + 1;
  } else {
    // Streak broken
    newStreak = 1;
  }

  const newLongestStreak = Math.max(newStreak, longestStreak);
  const hasStreakBonus = newStreak >= STREAK_CONFIG.TIER_THRESHOLDS.TIER1;
  
  // Check if we hit a milestone
  let milestoneHit: number | null = null;
  for (const milestone of STREAK_MILESTONES) {
    if (newStreak === milestone && newLongestStreak === newStreak) {
      milestoneHit = milestone;
      break;
    }
    // Also check if they beat their previous longest
    if (newStreak >= milestone && longestStreak < milestone) {
      milestoneHit = milestone;
      break;
    }
  }

  return { newStreak, newLongestStreak, hasStreakBonus, milestoneHit };
}

/**
 * Get the tier for a given streak
 */
function getStreakTier(streak: number): 'TIER1' | 'TIER2' | 'TIER3' | 'TIER4' | 'NONE' {
  if (streak >= STREAK_CONFIG.TIER_THRESHOLDS.TIER4) return 'TIER4';
  if (streak >= STREAK_CONFIG.TIER_THRESHOLDS.TIER3) return 'TIER3';
  if (streak >= STREAK_CONFIG.TIER_THRESHOLDS.TIER2) return 'TIER2';
  if (streak >= STREAK_CONFIG.TIER_THRESHOLDS.TIER1) return 'TIER1';
  return 'NONE';
}

/**
 * Calculates the streak bonus ELO for a match using tiered system
 * Returns { bonus: number, newDailyTotal: number, resetDaily: boolean, tier: string }
 */
export function calculateStreakBonus(
  currentStreak: number,
  todayStreakBonus: number = 0,
  lastBonusResetDate: Date | null = null
): { bonus: number; newDailyTotal: number; resetDaily: boolean; tier: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if we need to reset daily bonus
  const lastReset = lastBonusResetDate ? new Date(lastBonusResetDate) : null;
  const shouldResetDaily = !lastReset || lastReset.getTime() !== today.getTime();
  
  if (shouldResetDaily) {
    // Reset daily tracking
    return {
      bonus: 0,
      newDailyTotal: 0,
      resetDaily: true,
      tier: getStreakTier(currentStreak),
    };
  }
  
  // Check if streak qualifies for bonus (need 3+ days)
  if (currentStreak < STREAK_CONFIG.TIER_THRESHOLDS.TIER1) {
    return { bonus: 0, newDailyTotal: todayStreakBonus, resetDaily: false, tier: 'NONE' };
  }
  
  // Get current tier and associated values
  const tier = getStreakTier(currentStreak);
  
  // Since we checked currentStreak >= TIER1, we know tier is one of the valid tiers
  // Use explicit lookup to avoid TypeScript narrowing issues
  const tierConfig = {
    TIER1: { bonus: STREAK_CONFIG.TIER_BONUS.TIER1, max: STREAK_CONFIG.TIER_MAX_DAILY.TIER1 },
    TIER2: { bonus: STREAK_CONFIG.TIER_BONUS.TIER2, max: STREAK_CONFIG.TIER_MAX_DAILY.TIER2 },
    TIER3: { bonus: STREAK_CONFIG.TIER_BONUS.TIER3, max: STREAK_CONFIG.TIER_MAX_DAILY.TIER3 },
    TIER4: { bonus: STREAK_CONFIG.TIER_BONUS.TIER4, max: STREAK_CONFIG.TIER_MAX_DAILY.TIER4 },
  } as const;
  
  const bonusPerMatch = (tierConfig as Record<string, {bonus: number, max: number}>)[tier].bonus;
  const maxDaily = (tierConfig as Record<string, {bonus: number, max: number}>)[tier].max;
  
  // Check if daily cap reached for this tier
  if (todayStreakBonus >= maxDaily) {
    return { bonus: 0, newDailyTotal: todayStreakBonus, resetDaily: false, tier };
  }
  
  // Calculate bonus (up to max daily for this tier)
  const newDailyTotal = todayStreakBonus + bonusPerMatch;
  const bonus = Math.min(bonusPerMatch, maxDaily - todayStreakBonus);
  
  return { bonus, newDailyTotal: Math.min(newDailyTotal, maxDaily), resetDaily: false, tier };
}
