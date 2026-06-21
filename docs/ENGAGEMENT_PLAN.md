# PingElo Engagement Features Plan

## Overview
This document outlines all planned engagement features to increase user retention and excitement. **No existing functionality will be modified** - all features are additive only.

---

## Phase 1: Quick Wins (Low effort, high impact)

### 1.1 Streak Milestone Celebrations
**Trigger:** When a player hits streak milestones (3, 7, 14, 30, 60, 90 days)

**Implementation:**
- Add milestone check in `calculateStreak()` function
- Return `milestoneHit` flag with milestone number
- Trigger confetti animation in match result UI
- Show toast notification: "🔥 7-Day Streak! You're on fire!"

**Files to modify:**
- `src/lib/elo.ts` - Add milestone detection
- `src/components/elo/MatchResult.tsx` or match creation flow - Add celebration UI

---

### 1.2 ELO Tier Announcements
**Trigger:** When a player's ELO crosses tier thresholds

**Current Tiers (from elo.ts):**
- Bronze: 0-1099
- Silver: 1100-1299
- Gold: 1300-1499
- Platinum: 1500-1699
- Diamond: 1700-1899
- Master: 1900-2099
- Grandmaster: 2100+

**Implementation:**
- Store `lastAnnouncedTier` on User model
- Check tier crossing after each match
- Show toast: "🎉 You've reached Platinum!"
- Add tier badge to profile with glow effect

**Files to modify:**
- `prisma/schema.prisma` - Add `lastAnnouncedTier` field
- `src/app/api/matches/route.ts` - Check tier after match
- `src/app/profile/[id]/page.tsx` - Display tier badge

---

### 1.3 Win Animation Upgrade
**Trigger:** When player wins a match

**Implementation:**
- Upgrade confetti to use canvas-confetti with specific patterns
- Add player avatar pulse animation
- Show "+X ELO" with satisfying bounce animation
- Add "VICTORY" banner for big upsets (beating someone 100+ ELO higher)

**Files to modify:**
- `src/components/elo/MatchResult.tsx` - Upgrade animations

---

### 1.4 Leaderboard Rank Changes
**Trigger:** On leaderboard load for logged-in user

**Implementation:**
- Fetch user's previous rank (stored in DB or calculated from history)
- Show rank change indicator:
  - 🔺 +N (green) when climbing
  - 🔻 -N (red) when falling
  - ➡️ (gray) if unchanged
- Store `lastKnownRank` on User model, update weekly

**Files to modify:**
- `prisma/schema.prisma` - Add `lastKnownRank`, `lastRankUpdate`
- `src/app/leaderboard/page.tsx` - Show rank changes
- `src/app/api/leaderboard/route.ts` - Calculate rank changes

---

## Phase 2: Medium Effort

### 2.1 Achievement System
**Trigger:** Various game events

**Achievement List:**
| Achievement | Trigger | Icon |
|-------------|---------|------|
| First Blood | Win first match ever | ⚔️ |
| Getting Started | Complete profile | 👋 |
| Hot Streak | 7-day streak | 🔥 |
| Blazing | 30-day streak | 💥 |
| Unstoppable | 90-day streak | ⚡ |
| Century Club | 100 total matches | 💯 |
| Centurion | 100 wins | 🏆 |
| Goliath Killer | Beat someone 200+ ELO above you | 👑 |
| Comeback Kid | Win after being down 5+ points | 💪 |
| Dominant | Win 11-0 | 🔱 |
| Quick Draw | Win in under 2 minutes | ⚡ |
| Doubles Rookie | Complete first doubles match | 🤝 |
| Team Player | Complete first team season | 👥 |
| Season Champion | Win a season | 🏅 |

**Implementation:**
- Add Achievement model to Prisma schema
- Add `unlockedAchievements` relation on User
- Create achievement check utility
- Run checks after each match
- Show unlock toast + badge on profile

**Files to create/modify:**
- `prisma/schema.prisma` - Add Achievement model
- `src/lib/achievements.ts` - Achievement definitions and check logic
- `src/app/api/matches/route.ts` - Trigger achievement checks
- `src/app/profile/[id]/page.tsx` - Display achievements
- `src/components/ui/Toast.tsx` - Achievement unlock toast

---

### 2.2 Weekly Top Climber
**Trigger:** Weekly calculation (cron job or on-demand)

**Implementation:**
- Store `weeklyEloGained` on User (resets weekly)
- Add "Top Climber" section to leaderboard page
- Show top 3 players who gained most ELO this week
- Badge on their avatar: "🏃 Top Climber"

**Files to modify:**
- `prisma/schema.prisma` - Add `weeklyEloGained`, `weeklyResetDate`
- `src/app/api/leaderboard/route.ts` - Add top climber query
- `src/app/leaderboard/page.tsx` - Display top climber section
- `src/app/api/cron/weekly-reset/route.ts` - Reset weekly stats

---

### 2.3 Match Reactions
**Trigger:** After viewing a match

**Implementation:**
- Add `MatchReaction` model (userId, matchId, emoji)
- Show reaction picker on MatchCard (🔥 👏 😎 💪 🎉)
- Display reaction count per emoji
- Limit 1 reaction per user per match

**Files to create/modify:**
- `prisma/schema.prisma` - Add MatchReaction model
- `src/app/api/matches/[id]/reactions/route.ts` - Reaction CRUD
- `src/components/elo/MatchCard.tsx` - Add reaction UI
- `src/app/matches/history/page.tsx` - Enable reactions

---

### 2.4 Season Countdown
**Trigger:** Dashboard and leaderboard pages

**Implementation:**
- Fetch current season end date from API
- Display countdown timer: "12 days left in Season March 2024"
- Show top 3 leaderboard preview
- Add urgency messaging: "Less than 3 days! Final push!"

**Files to modify:**
- `src/app/dashboard/page.tsx` - Add season countdown widget
- `src/app/leaderboard/page.tsx` - Add countdown banner
- `src/app/api/seasons/current/route.ts` - Return countdown data

---

## Phase 3: High Impact

### 3.1 Activity Feed
**Trigger:** Dashboard load

**Implementation:**
- Create Activity model (actor, action, target, metadata, createdAt)
- Log events: match_completed, achievement_unlocked, rank_up, streak_milestone
- Fetch recent activities for dashboard
- Display feed with player avatars and action descriptions

**Files to create/modify:**
- `prisma/schema.prisma` - Add Activity model
- `src/lib/activity.ts` - Activity logging utility
- `src/app/api/activity/route.ts` - Fetch activities
- `src/app/dashboard/page.tsx` - Display activity feed

---

### 3.2 Tournament Brackets
**Implementation:**
- Create TournamentBracket component
- Support single-elimination and double-elimination
- Real-time updates as matches complete
- Animated bracket progression

**Files to create:**
- `src/components/tournament/Bracket.tsx`
- `src/components/tournament/MatchNode.tsx`
- `src/app/tournaments/[id]/page.tsx` - Update to show bracket

---

### 3.3 Challenge System
**Implementation:**
- Add Challenge model (challengerId, challengedId, stakeAmount, status, deadline)
- Create challenge API endpoints
- Show pending challenges on dashboard
- **Stakes-based system:**
  - Challenger stakes 5-25 ELO (deducted on create)
  - Challenged must match stake (deducted on accept)
  - Winner takes all (gets both stakes back + opponent's stake)
  - Loser's stake goes to winner

**Challenge Flow:**
1. Challenger creates challenge → 5-25 ELO deducted (escrow)
2. Challenged accepts → Must also stake matching amount
3. Match played → Either player marks complete
4. Winner → Gets 2x their stake (own + opponent's)
5. Decline/Cancel → Challenger's stake refunded

**Files to create/modify:**
- `prisma/schema.prisma` - Add Challenge model
- `src/app/api/challenges/route.ts`
- `src/app/challenges/page.tsx`
- `src/app/dashboard/page.tsx` - Show pending challenges

---

## Database Schema Additions

```prisma
// Tier announcement tracking
model User {
  // ... existing fields ...
  lastAnnouncedTier String?
  lastKnownRank Int?
  lastRankUpdate DateTime?
  weeklyEloGained Int @default(0)
  weeklyResetDate DateTime?
}

// Achievement tracking
model Achievement {
  id String @id @default(cuid())
  slug String @unique  // e.g., "first_blood", "hot_streak"
  name String
  description String
  icon String
  unlockedAt DateTime?
  userId String
  user User @relation(fields: [userId], references: [id])
  @@unique([userId, slug])
}

// Match reactions
model MatchReaction {
  id String @id @default(cuid())
  userId String
  matchId String
  emoji String  // Single emoji character
  createdAt DateTime @default(now())
  @@unique([userId, matchId])
}

// Activity feed
model Activity {
  id String @id @default(cuid())
  actorId String
  actorName String
  action String  // "won_against", "unlocked_achievement", "reached_tier"
  metadata Json?
  createdAt DateTime @default(now())
  @@index([createdAt])
}

// Challenges
model Challenge {
  id String @id @default(cuid())
  challengerId String
  challengedId String
  stakeAmount Int @default(5)  // ELO stake (5-25)
  status ChallengeStatus @default(PENDING)  // PENDING, ACCEPTED, DECLINED, COMPLETED
  expiresAt DateTime @default(now())  // Auto-expire after 7 days
  winnerId String?
  matchId String?  // Optional link to match
  createdAt DateTime @default(now())
}
```

---

## Testing Strategy

1. **Unit tests** for achievement checking logic
2. **Integration tests** for milestone/tier detection
3. **UI tests** for animations and toasts
4. **Manual testing** of all celebration triggers

---

## Rollout Order

1. ✅ Plan file (this document)
2. Phase 1.1-1.4: Quick wins (minimal risk)
3. Phase 2.1: Achievement system (self-contained)
4. Phase 2.2-2.4: Weekly features
5. Phase 3: High-impact features (larger scope)

---

## Success Metrics

- **DAU/MAU ratio increase** (engagement)
- **Match completion rate** (retention)
- **Streak continuation rate** (habit formation)
- **Achievement unlock rate** (motivation)
- **Season participation** (competition)
