# PingElo ELO System Documentation

This document explains how the ELO rating system works in PingElo, including singles matches, doubles matches, tournaments, and seasons.

---

## Overview

PingElo uses a modified ELO rating system with different K-factors based on experience level. There are two main ELO types:

1. **Forever ELO** - Lifetime rating that accumulates across all matches
2. **Season ELO** - Resets each season, tracks performance within the current season

---

## K-Factor System

The K-factor determines how much your ELO can change per match. Higher K = bigger swings.

### Forever ELO K-Factors (Lifetime Matches)

| Tier | Games Played | K-Factor |
|------|-------------|----------|
| New Player | 0-10 | 64 |
| Adjusting | 11-30 | 48 |
| Established | 31-100 | 32 |
| Veteran | 100+ | 24 |

### Season ELO K-Factors (Season Matches)

| Tier | Season Games | K-Factor |
|------|-------------|----------|
| Season New | 0-3 | 48 |
| Season Adjusting | 4-10 | 36 |
| Season Established | 11-25 | 24 |
| Season Veteran | 26+ | 16 |

### Key Differences
- **Season K-factors are lower** to account for season resets
- **Thresholds are lower** since seasons are shorter than lifetime play
- **Doubles uses average** of both teammates' season matches

---

## Match Types

### Singles Matches (1v1)
- Player ELO changes based on their individual K-factor
- Season ELO uses season K-factor
- Forever ELO uses lifetime K-factor

### Doubles Matches (2v2)
- Each player's ELO changes based on their **team's** match history
- Both teammates receive the same ELO change
- Season ELO uses average of both players' season matches for K-factor
- Forever ELO uses average of both players' lifetime matches for K-factor

### Tournaments
- Entry fee deducted from each player's ELO
- House adds 50 ELO to prize pool
- Prize distribution:
  - 1st place: 50%
  - 2nd place: 35%
  - 3rd place: 15%
- ELO changes from tournament matches **only affect Forever ELO** (season ELO is not changed)

---

## ELO Change Calculation

### Standard Formula
```
ELO Change = K × (Actual Score - Expected Score) × Margin Multiplier
```

Where:
- `K` = K-factor (based on games played)
- `Actual Score` = 1 for win, 0.5 for draw, 0 for loss
- `Expected Score` = 1 / (1 + 10^((Opponent ELO - Player ELO) / 400))
- `Margin Multiplier` = Based on score difference

### Margin Multipliers
| Point Difference | Multiplier |
|-----------------|------------|
| 1-4 points | 1.0 (Close) |
| 5-9 points | 1.25 (Clear) |
| 10+ points | 1.5 (Dominance) |

---

## Activity Streak System

Players earn an ELO bonus for consecutive daily play.

### Tiered Bonus System
| Days | Bonus/Match | Max/Day |
|------|-------------|---------|
| 3-6 | +1 ELO | 5 |
| 7-13 | +2 ELO | 10 |
| 14-29 | +3 ELO | 15 |
| 30+ | +5 ELO | 25 |

### Configuration
- **Minimum streak**: 3 consecutive days
- **Grace period**: 2 days (can miss 2 days without breaking streak)
- **Resets**: After 3+ days of no matches
- **Daily cap**: Based on tier (5-25 ELO per day)

### Streak Tracking Fields
- `currentStreak`: Consecutive days with matches
- `longestStreak`: All-time best streak
- `lastMatchDate`: When player last played
- `todayStreakBonus`: Bonus earned today (resets daily)
- `lastBonusResetDate`: When daily bonus was last reset

---

## Team System

### Team Creation Rules
- Each person can **create 1 team** per season
- Each person can be **in 2 teams** maximum per season
- Both players join at the same time when created
- Team is activated for the current season

### Team Leave/Deactivation Rules

**If NO matches played this season:**
- Either member can leave
- Team is **deleted** (if only creator)
- Team is **deactivated** (if both joined)
- Activation slot is freed for re-use

**If MATCHES played this season:**
- Neither member can leave
- Admin can remove players
- Team continues to exist

**When either member leaves before playing:**
- Team is deactivated
- Both members freed from the team
- Original activator can reactivate later

---

## Seasons

### Season Mechanics
- Each season has its own **Season ELO** (starts at 1000)
- Forever ELO accumulates across all seasons
- Season ELO resets at season end
- Season stats tracked separately

### Season Reset
- Only Season ELO resets (back to 1000)
- Forever ELO never resets
- Match history preserved
- Streaks reset with new season

---

## Recalculating ELO

Admins can trigger a full ELO recalculation from `/dashboard/admin`.

### What it does:
1. Fetches all non-deleted matches in chronological order
2. Resets all users to 1000 ELO
3. Replays every match to rebuild ELO from scratch
4. Preserves win/loss records

### Use cases:
- Fix data corruption
- After major system changes
- Recovery from bugs

---

## Match Deletion (Admin)

Admins can delete matches via `/api/admin/delete-match`.

### What happens:
1. Match is soft-deleted (marked with `deletedAt`)
2. ELO changes are reverted (if `revertElo: true`)
3. ELO history entries are deleted
4. Tournament matches cannot be deleted if tournament is COMPLETED

---

## Example Scenarios

### Scenario 1: New Player vs Veteran
- New Player (0 games) plays against Veteran (200 games)
- New Player K = 64, Veteran K = 24
- If New Player upsets Veteran and wins:
  - New Player gains: ~64 × (1 - 0.1) × 1.25 ≈ 72 ELO
  - Veteran loses: ~24 × (0 - 0.9) × 1.25 ≈ -27 ELO

### Scenario 2: Doubles Match
- Team A (p1: 50 games, p2: 20 games) vs Team B (p1: 100 games, p2: 150 games)
- Team A average: 35 games → K = 32
- Team B average: 125 games → K = 24
- Both Team A players receive the same ELO change

### Scenario 3: Tournament Prize
- Tournament with 10 players, 100 ELO entry fee each
- Prize pool = (10 × 100) + 50 house = 1050 ELO
- Winner gets: 1050 × 0.50 = 525 ELO bonus
- Runner-up gets: 1050 × 0.35 = 367 ELO bonus
- Third place gets: 1050 × 0.15 = 157 ELO bonus

---

## File Reference

| File | Purpose |
|------|---------|
| `src/lib/elo.ts` | Core ELO calculation logic |
| `src/app/api/matches/route.ts` | Match creation and listing |
| `src/app/api/teams/[id]/route.ts` | Team management |
| `src/app/api/admin/recalculate-elo/route.ts` | ELO recalculation |
| `prisma/schema.prisma` | Database models |
