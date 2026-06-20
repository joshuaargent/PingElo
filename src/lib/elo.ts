/**
 * ELO Rating System Implementation for PingElo
 * 
 * This module implements an enhanced ELO rating system optimized for
 * small recreational ping pong leagues (10-50 players) with frequent play.
 * 
 * Key Features:
 * - Dynamic K-factor for faster convergence with new players
 * - Score margin multiplier for casual matches
 * - Activity bonus to prevent ELO economy stagnation
 * - Inactivity indicators (informational only)
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
  FIRST: 0.60,        // 60% to 1st place
  SECOND: 0.25,       // 25% to 2nd place
  THIRD_FOURTH: 0.075, // 7.5% each to 3rd/4th place
} as const;

/** Season champion bonus percentage */
export const SEASON_CHAMPION_BONUS = 0.10; // 10% of season gains

// ============================================
// Types
// ============================================

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
// Expected Score Calculation
// ============================================

/**
 * Calculates expected score for a player based on ELO difference
 * Uses the standard ELO expected score formula
 */
export function getExpectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
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
  // Tournament matches don't use margin multiplier
  if (isTournament) {
    return 1.0;
  }

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
// Main ELO Calculation
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
      case 4:
        payout = Math.floor(totalPrizePool * TOURNAMENT_PAYOUT.THIRD_FOURTH);
        break;
      default:
        payout = 0;
    }

    payouts.set(placement, payout);
  }

  return payouts;
}

/**
 * Calculates entry fee based on player's ELO tier
 * Below 800 ELO = free, 800-1000 = 10 ELO, 1000-1200 = 20 ELO, 1200+ = 50 ELO
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
 */
export function getEloTierLabel(elo: number): string {
  if (elo < 800) return "Beginner (Free Entry)";
  if (elo < 1000) return "Intermediate (10 ELO entry)";
  if (elo < 1200) return "Advanced (20 ELO entry)";
  return "Expert (50 ELO entry)";
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
 * Platform adds 500 ELO to each tournament prize pool
 */
export const TOURNAMENT_HOUSE_INJECTION = 500;

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
