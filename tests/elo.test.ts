/**
 * ELO Calculation Tests
 */
import { describe, it, expect } from 'vitest';
import {
  getKFactor,
  getKFactorLabel,
  getExpectedScore,
  getMarginMultiplier,
  getMarginLabel,
  calculateEloChange,
  checkActivityBonus,
  checkRustyStatus,
  calculateEntryFee,
  getEloTierLabel,
  calculateTournamentPayout,
  formatEloChange,
  getEloTierColor,
  getEloTierBadgeColor,
  DEFAULT_ELO,
  K_FACTORS,
} from '@/lib/elo';

describe('ELO Calculation Tests', () => {
  // ============================================
  // K-Factor Tests
  // ============================================

  describe('getKFactor', () => {
    it('should return 64 for players with 0-10 games', () => {
      expect(getKFactor(0)).toBe(K_FACTORS.NEW_PLAYER);
      expect(getKFactor(5)).toBe(K_FACTORS.NEW_PLAYER);
      expect(getKFactor(9)).toBe(K_FACTORS.NEW_PLAYER);
    });

    it('should return 48 for players with 11-30 games', () => {
      expect(getKFactor(11)).toBe(K_FACTORS.ADJUSTING);
      expect(getKFactor(20)).toBe(K_FACTORS.ADJUSTING);
      expect(getKFactor(29)).toBe(K_FACTORS.ADJUSTING);
    });

    it('should return 32 for players with 31-100 games', () => {
      expect(getKFactor(31)).toBe(K_FACTORS.ESTABLISHED);
      expect(getKFactor(50)).toBe(K_FACTORS.ESTABLISHED);
      expect(getKFactor(99)).toBe(K_FACTORS.ESTABLISHED);
    });

    it('should return 24 for players with 100+ games', () => {
      expect(getKFactor(100)).toBe(K_FACTORS.VETERAN);
      expect(getKFactor(101)).toBe(K_FACTORS.VETERAN);
      expect(getKFactor(150)).toBe(K_FACTORS.VETERAN);
      expect(getKFactor(500)).toBe(K_FACTORS.VETERAN);
    });
  });

  describe('getKFactorLabel', () => {
    it('should return correct label for new players', () => {
      expect(getKFactorLabel(5)).toBe('New Player (64)');
    });

    it('should return correct label for adjusting players', () => {
      expect(getKFactorLabel(20)).toBe('Still Adjusting (48)');
    });

    it('should return correct label for established players', () => {
      expect(getKFactorLabel(50)).toBe('Established (32)');
    });

    it('should return correct label for veteran players', () => {
      expect(getKFactorLabel(150)).toBe('Veteran (24)');
    });
  });

  // ============================================
  // Expected Score Tests
  // ============================================

  describe('getExpectedScore', () => {
    it('should return 0.5 for equal players', () => {
      expect(getExpectedScore(1000, 1000)).toBe(0.5);
    });

    it('should return higher value for higher-rated player', () => {
      expect(getExpectedScore(1200, 1000)).toBeGreaterThan(0.5);
      expect(getExpectedScore(1200, 1000)).toBeLessThan(1);
    });

    it('should return lower value for lower-rated player', () => {
      expect(getExpectedScore(800, 1000)).toBeLessThan(0.5);
      expect(getExpectedScore(800, 1000)).toBeGreaterThan(0);
    });

    it('should be symmetric', () => {
      const p1vsP2 = getExpectedScore(1000, 1200);
      const p2vsP1 = getExpectedScore(1200, 1000);
      expect(p1vsP2 + p2vsP1).toBeCloseTo(1, 10);
    });
  });

  // ============================================
  // Margin Multiplier Tests
  // ============================================

  describe('getMarginMultiplier', () => {
    it('should return 1.0 for close games (1-4 points)', () => {
      expect(getMarginMultiplier(21, 19)).toBe(1.0);
      expect(getMarginMultiplier(21, 18)).toBe(1.0);
      expect(getMarginMultiplier(21, 17)).toBe(1.0);
    });

    it('should return 1.25 for clear wins (5-9 points)', () => {
      expect(getMarginMultiplier(21, 16)).toBe(1.25);
      expect(getMarginMultiplier(21, 14)).toBe(1.25);
      expect(getMarginMultiplier(21, 12)).toBe(1.25);
    });

    it('should return 1.5 for dominance (10+ points)', () => {
      expect(getMarginMultiplier(21, 10)).toBe(1.5);
      expect(getMarginMultiplier(21, 8)).toBe(1.5);
      expect(getMarginMultiplier(21, 3)).toBe(1.5);
    });

    it('should always return 1.0 for tournament matches', () => {
      expect(getMarginMultiplier(21, 3, true)).toBe(1.0);
      expect(getMarginMultiplier(21, 19, true)).toBe(1.0);
    });
  });

  describe('getMarginLabel', () => {
    it('should return correct labels for margins', () => {
      expect(getMarginLabel(3)).toBe('Close game (1.0x)');
      expect(getMarginLabel(6)).toBe('Clear win (1.25x)');
      expect(getMarginLabel(12)).toBe('Dominance (1.5x)');
    });
  });

  // ============================================
  // ELO Change Calculation Tests
  // ============================================

  describe('calculateEloChange', () => {
    it('should calculate correct change for equal players, new player wins 21-19', () => {
      const result = calculateEloChange(
        1000, 1000,  // ELOs
        5, 5,        // Games played
        { player1Score: 21, player2Score: 19, winnerId: 'player1' },
        false
      );

      // Expected: K=64, expected=0.5, actual=1, margin=1.0
      // change = 64 * (1 - 0.5) * 1.0 = 32
      expect(result.player1Change).toBe(32);
      expect(result.player2Change).toBe(-32);
      expect(result.player1NewElo).toBe(1032);
      expect(result.player2NewElo).toBe(968);
    });

    it('should calculate correct change for new player wins 21-8 (dominance)', () => {
      const result = calculateEloChange(
        1000, 1000,
        5, 5,
        { player1Score: 21, player2Score: 8, winnerId: 'player1' },
        false
      );

      // Expected: K=64, expected=0.5, actual=1, margin=1.5
      // change = 64 * (1 - 0.5) * 1.5 = 48
      expect(result.player1Change).toBe(48);
      expect(result.player2Change).toBe(-48);
      expect(result.player1NewElo).toBe(1048);
      expect(result.player2NewElo).toBe(952);
    });

    it('should calculate correct change for upset (lower-rated player wins)', () => {
      const result = calculateEloChange(
        800, 1200,   // Lower player vs higher player
        5, 50,       // Both players' games
        { player1Score: 21, player2Score: 18, winnerId: 'player1' },
        false
      );

      // Lower player wins as underdog - should gain more
      expect(result.player1Change).toBeGreaterThan(0);
      expect(result.player2Change).toBeLessThan(0);
    });

    it('should not use margin multiplier for tournament matches', () => {
      const casualResult = calculateEloChange(
        1000, 1000,
        5, 5,
        { player1Score: 21, player2Score: 8, winnerId: 'player1' },
        false
      );

      const tournamentResult = calculateEloChange(
        1000, 1000,
        5, 5,
        { player1Score: 21, player2Score: 8, winnerId: 'player1' },
        true
      );

      // Tournament should give less points for the same score
      expect(tournamentResult.player1Change).toBeLessThan(casualResult.player1Change);
    });

    it('should handle veteran players with lower K-factor', () => {
      const result = calculateEloChange(
        1000, 1000,
        150, 150,  // Veteran players
        { player1Score: 21, player2Score: 19, winnerId: 'player1' },
        false
      );

      // K=24 for veterans, so change should be smaller
      // change = 24 * (1 - 0.5) * 1.0 = 12
      expect(result.player1Change).toBe(12);
    });
  });

  // ============================================
  // Activity Bonus Tests
  // ============================================

  describe('checkActivityBonus', () => {
    it('should qualify for bonus with 2+ matches per week', () => {
      const result = checkActivityBonus(2);
      expect(result.qualified).toBe(true);
      expect(result.bonus).toBe(5);
    });

    it('should not qualify with less than 2 matches', () => {
      const result = checkActivityBonus(1);
      expect(result.qualified).toBe(false);
      expect(result.bonus).toBe(0);
    });

    it('should handle 0 matches', () => {
      const result = checkActivityBonus(0);
      expect(result.qualified).toBe(false);
      expect(result.bonus).toBe(0);
    });
  });

  // ============================================
  // Rusty Status Tests
  // ============================================

  describe('checkRustyStatus', () => {
    it('should not be rusty with recent match', () => {
      const recentDate = new Date();
      const result = checkRustyStatus(recentDate);
      expect(result.isRusty).toBe(false);
    });

    it('should be rusty after 4+ weeks of inactivity', () => {
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const result = checkRustyStatus(fourWeeksAgo);
      expect(result.isRusty).toBe(true);
    });

    it('should not be rusty for null date', () => {
      const result = checkRustyStatus(null);
      expect(result.isRusty).toBe(false);
      expect(result.weeksSinceLastMatch).toBeNull();
    });
  });

  // ============================================
  // Entry Fee Tests
  // ============================================

  describe('calculateEntryFee', () => {
    it('should return 0 for players below 800 ELO', () => {
      expect(calculateEntryFee(700)).toBe(0);
      expect(calculateEntryFee(500)).toBe(0);
      expect(calculateEntryFee(799)).toBe(0);
    });

    it('should return 10 for players 800-999 ELO', () => {
      expect(calculateEntryFee(800)).toBe(10);
      expect(calculateEntryFee(900)).toBe(10);
      expect(calculateEntryFee(999)).toBe(10);
    });

    it('should return 20 for players 1000-1199 ELO', () => {
      expect(calculateEntryFee(1000)).toBe(20);
      expect(calculateEntryFee(1100)).toBe(20);
      expect(calculateEntryFee(1199)).toBe(20);
    });

    it('should return 50 for players 1200+ ELO', () => {
      expect(calculateEntryFee(1200)).toBe(50);
      expect(calculateEntryFee(1500)).toBe(50);
    });
  });

  describe('getEloTierLabel', () => {
    it('should return correct tier labels', () => {
      expect(getEloTierLabel(700)).toContain('Beginner');
      expect(getEloTierLabel(850)).toContain('Intermediate');
      expect(getEloTierLabel(1050)).toContain('Advanced');
      expect(getEloTierLabel(1250)).toContain('Expert');
    });
  });

  // ============================================
  // Tournament Payout Tests
  // ============================================

  describe('calculateTournamentPayout', () => {
    it('should calculate correct payouts for top 4', () => {
      const pool = 1000;
      const payouts = calculateTournamentPayout(pool, [1, 2, 3, 4]);

      expect(payouts.get(1)).toBe(600);  // 60%
      expect(payouts.get(2)).toBe(250);  // 25%
      expect(payouts.get(3)).toBe(75);   // 7.5%
      expect(payouts.get(4)).toBe(75);   // 7.5%
    });

    it('should return empty map for empty placements', () => {
      const payouts = calculateTournamentPayout(1000, []);
      expect(payouts.size).toBe(0);
    });

    it('should return empty map for 0 prize pool', () => {
      const payouts = calculateTournamentPayout(0, [1, 2]);
      expect(payouts.size).toBe(0);
    });
  });

  // ============================================
  // Formatting Tests
  // ============================================

  describe('formatEloChange', () => {
    it('should format positive changes with +', () => {
      expect(formatEloChange(32)).toBe('+32');
      expect(formatEloChange(1)).toBe('+1');
    });

    it('should format negative changes without +', () => {
      expect(formatEloChange(-32)).toBe('-32');
      expect(formatEloChange(-1)).toBe('-1');
    });

    it('should format zero without sign', () => {
      expect(formatEloChange(0)).toBe('0');
    });
  });

  // ============================================
  // ELO Tier Tests
  // ============================================

  describe('ELO Tier Styling', () => {
    it('getEloTierColor should return correct colors', () => {
      expect(getEloTierColor(700)).toBe('text-gray-400');
      expect(getEloTierColor(900)).toBe('text-green-500');
      expect(getEloTierColor(1100)).toBe('text-blue-500');
      expect(getEloTierColor(1300)).toBe('text-purple-500');
      expect(getEloTierColor(1500)).toBe('text-yellow-500');
    });

    it('getEloTierBadgeColor should return correct badge colors', () => {
      expect(getEloTierBadgeColor(700)).toContain('gray');
      expect(getEloTierBadgeColor(900)).toContain('green');
      expect(getEloTierBadgeColor(1100)).toContain('blue');
      expect(getEloTierBadgeColor(1300)).toContain('purple');
      expect(getEloTierBadgeColor(1500)).toContain('yellow');
    });
  });

  // ============================================
  // Default Values Tests
  // ============================================

  describe('Default Values', () => {
    it('should have correct default ELO', () => {
      expect(DEFAULT_ELO).toBe(1000);
    });
  });
});
