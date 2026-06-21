# PingElo Documentation Conflict Review

**Date:** June 21, 2026  
**Status:** RESOLVED (pending team features)

---

## RESOLVED CONFLICTS

### ✅ 1. TOURNAMENT PAYOUT - UPDATED

Updated `docs/ELO_SYSTEM.md` to match code (50/35/15).

### ✅ 2. STREAK BONUS - RESOLVED

Code now uses tiered system matching how-it-works:
- 3-6 days: +1 ELO (max 5/day)
- 7-13 days: +2 ELO (max 10/day)
- 14-29 days: +3 ELO (max 15/day)
- 30+ days: +5 ELO (max 25/day)

### ✅ 3. CHALLENGE DESCRIPTION - UPDATED

ENGAGEMENT_PLAN.md updated to reflect stake-based challenges.

---

## CURRENT STATUS: ELO HISTORY & STREAKS

### ✅ Streak Tracking in ELO History

ELO history correctly records streak bonuses:

```typescript
// From matches/route.ts
await tx.eloHistory.create({
  data: {
    userId: player1Id,
    matchId: newMatch.id,
    changeType: 'MATCH',
    eloBefore: p1EloBefore,
    eloAfter: p1EloAfter,
    change: eloResult.player1Change,
    metadata: {
      // ... match details ...
      streakBonus: p1StreakResult.bonus,    // ✅ Bonus amount
      streakBefore: player1.currentStreak,   // ✅ Before match
      streakAfter: p1Streak.newStreak,       // ✅ After match
    },
  },
});
```

Each match record includes:
- `streakBonus`: The bonus ELO earned from streak
- `streakBefore`: Streak count before match
- `streakAfter`: Streak count after match

---

## CHALLENGE COMPLETION FLOW

### Current Implementation

Challenges are **NOT auto-completed** through regular/tournament match play:

1. **Create challenge** → PENDING (challenger stakes ELO)
2. **Accept challenge** → ACCEPTED (challenged stakes ELO)
3. **Play match** → No link to challenge (must play anywhere)
4. **Complete challenge** → COMPLETED (separate action, winner gets payout)

### Issue Identified

- Tournament matches don't automatically complete challenges
- Regular matches don't link to challenges
- Manual `complete` action required after playing

### Options

**Option A: Keep as-is** - Manual completion required
**Option B: Auto-complete** - Link match to challenge, auto-payout on match creation

**Recommendation:** Option A for now (MVP), Option B as enhancement.

---

## TEAM FEATURES (RECOMMENDED ADDITIONS)

### Team Activity/Streaks

Teams should have same engagement features as players:

| Feature | Players | Teams |
|---------|---------|-------|
| Daily Streak | ✅ | ❌ Recommended |
| Streak Milestones | ✅ | ❌ Recommended |
| Top Climber | ✅ (weekly ELO) | ❌ Recommended |
| Activity Feed | ✅ | ❌ Recommended |

### Team Challenges

**Recommended for future:** Team-vs-team challenges on challenges page.

---

## FEATURES CHECKLIST

### ✅ FULLY IMPLEMENTED

| Feature | Documentation | Code | UI |
|---------|---------------|------|-----|
| Singles ELO | ✅ | ✅ | ✅ |
| Doubles ELO | ✅ | ✅ | ✅ |
| K-factors | ✅ | ✅ | ✅ |
| Score margins | ✅ | ✅ | ✅ |
| Season ELO | ✅ | ✅ | ✅ |
| Forever ELO | ✅ | ✅ | ✅ |
| Streak system (tiered) | ✅ | ✅ | ✅ |
| Grace period (2 days) | ✅ | ✅ | ✅ |
| Challenge stakes (5-25) | ✅ | ✅ | ✅ |
| Winner takes all | ✅ | ✅ | ✅ |
| Streak in ELO history | ✅ | ✅ | N/A |
| Weekly activity tracking | ✅ | ✅ | ✅ |
| Top Climber widget | ✅ | ✅ | ✅ |
| Tournament entry fees | ✅ | ✅ | ✅ |
| Tournament payouts | ✅ | ✅ | ✅ |
| Season countdown | ✅ | ✅ | ✅ |
| Season reset | ✅ | ✅ | ✅ |
| Weekly reset page | ✅ | ✅ | ✅ |
| Team system | ✅ | ✅ | ✅ |
| Achievements | ✅ | ✅ | ✅ |
| Activity feed (players) | ✅ | ✅ | ✅ |
| Match reactions | ✅ | ✅ | ✅ |
| Confetti animations | ✅ | ✅ | ✅ |

### ⚠️ PARTIALLY IMPLEMENTED

| Feature | Documentation | Code | UI |
|---------|---------------|------|-----|
| Leaderboard rank changes | ✅ (planned) | ⚠️ (field exists) | ❌ (not shown) |

### ❌ NOT IMPLEMENTED (RECOMMENDED FOR FUTURE)

| Feature | Priority |
|---------|----------|
| Team streaks/activity | HIGH |
| Team challenges | MEDIUM |
| Auto-complete challenges from matches | MEDIUM |
| 4th place tournament payout | LOW |

---

## MY RECOMMENDATIONS

### Challenges: Stakes are BETTER

Stakes-based challenges are more engaging than percentage bonuses:
- **Higher stakes** = more excitement
- **Risk/reward** = strategic decisions
- **"Winner takes all"** = clear outcome, satisfying win
- **5-25 ELO range** = not too risky, meaningful

Percentage bonuses (5-10%) would be:
- Too small to feel impactful
- Disconnected from actual ELO changes
- Less exciting than real stakes

### Team Engagement Features

Teams should mirror player engagement:
1. **Team Streaks** - Track consecutive days team won matches
2. **Team Activity Feed** - Log team match completions
3. **Team Milestones** - Celebrate team achievements (10 wins, 50 ELO gained, etc.)
4. **Team Challenges** - VS other teams with stakes

---

## ACTION ITEMS

### Completed ✅

- [x] Update ELO_SYSTEM.md tournament payout (50/35/15)
- [x] Update ENGAGEMENT_PLAN.md challenge description
- [x] Fix streak tiered system
- [x] Add challenge stakes UI (5-25 ELO)
- [x] Create weekly reset page

### Recommended for Future

- [ ] Add team streaks system
- [ ] Add team activity feed
- [ ] Add team challenges
- [ ] Auto-complete challenges from matches (optional)
- [ ] Add leaderboard rank change UI

---

*Last Updated: June 21, 2026*
