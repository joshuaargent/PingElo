# PingElo Engagement Features Plan

## Overview
This document outlines all planned engagement features to increase user retention and excitement. **No existing functionality will be modified** - all features are additive only.

---

## Phase 1: Quick Wins (Low effort, high impact)

### 1.1 Streak Milestone Celebrations ✅ IMPLEMENTED
**Trigger:** When a player hits streak milestones (3, 7, 14, 30, 60, 90 days)

**Implementation:**
- ✅ Add milestone check in `calculateStreak()` function
- ✅ Return `milestoneHit` flag with milestone number
- ✅ Confetti animation in match result UI
- ✅ Tier announcement toast (tier-ups also show toast)

**Files modified:**
- `src/lib/elo.ts` - ✅ Add milestone detection
- `src/components/elo/MatchResult.tsx` - ✅ Celebration UI

---

### 1.2 ELO Tier Announcements ✅ IMPLEMENTED
**Trigger:** When a player's ELO crosses tier thresholds

**Current Tiers (from elo.ts):**
- Rookie: 0-799
- Bronze: 800-1099
- Silver: 1100-1299
- Gold: 1300-1499
- Platinum: 1500-1699
- Diamond: 1700-1899
- Master: 1900-2099
- Grandmaster: 2100-2299
- Legend: 2300+

**Implementation:**
- ✅ Store `lastAnnouncedTier` on User model
- ✅ Check tier crossing after each match (singles & doubles)
- ✅ Returns tier crossing info in match response
- ✅ UI can display tier announcements from match result

**Files modified:**
- `prisma/schema.prisma` - ✅ Add `lastAnnouncedTier` field
- `src/app/api/matches/route.ts` - ✅ Check tier after match, persist
- Tier announcement UI on profile can now read from `lastAnnouncedTier`

---

### 1.3 Win Animation Upgrade ✅ IMPLEMENTED
**Trigger:** When player wins a match

**Implementation:**
- ✅ Upgrade confetti to use canvas-confetti with specific patterns
- ✅ Add player avatar pulse animation
- ✅ Show "+X ELO" with satisfying bounce animation
- ✅ Add "VICTORY" banner for big upsets (beating someone 100+ ELO higher)

**Files modified:**
- `src/components/elo/MatchResult.tsx` - ✅ Upgrade animations

---

### 1.4 Leaderboard Rank Changes ✅ IMPLEMENTED
**Trigger:** On leaderboard load for logged-in user

**Implementation:**
- ✅ Fetch user's previous rank (stored in DB)
- ✅ Show rank change indicator:
  - 🔺 +N (green) when climbing
  - 🔻 -N (red) when falling
  - ➡️ (gray) if unchanged
- ✅ Store `lastKnownRank` on User model

**Files modified:**
- `prisma/schema.prisma` - ✅ Add `lastKnownRank`, `lastRankUpdate`
- `src/app/leaderboard/page.tsx` - ✅ Show rank changes

---

## Phase 2: Medium Effort

### 2.1 Achievement System ✅ IMPLEMENTED
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
- ✅ Add Achievement model to Prisma schema
- ✅ Add `unlockedAchievements` relation on User
- ✅ Create achievement check utility
- ✅ Run checks after each match
- ✅ Show unlock toast + badge on profile

**Files created/modified:**
- `prisma/schema.prisma` - ✅ Add Achievement model
- `src/lib/achievements.ts` - ✅ Achievement definitions and check logic
- `src/app/api/matches/route.ts` - ✅ Trigger achievement checks
- `src/app/profile/[id]/page.tsx` - ✅ Display achievements
- `src/app/api/achievements/check/route.ts` - ✅ Achievement API

---

### 2.2 Weekly Top Climber ✅ IMPLEMENTED (ENHANCED)
**Trigger:** Weekly calculation (cron job or on-demand)

**Implementation:**
- ✅ Store weekly stats on User (resets with season)
- ✅ Add "Top Climber" section to leaderboard page
- ✅ Show top 3 players who gained most ELO this week
- ✅ Badge on their avatar: "🏃 Top Climber"
- ✅ **ENHANCED**: Separate categories (Singles, Doubles, Teams) with 10% bonus each

**Files modified:**
- `prisma/schema.prisma` - ✅ Add weekly tracking fields per mode
- `src/app/api/weekly-reset/route.ts` - ✅ Weekly bonus distribution
- `src/app/leaderboard/page.tsx` - ✅ Display top climber section

---

### 2.3 Match Reactions ✅ IMPLEMENTED
**Trigger:** After viewing a match

**Implementation:**
- ✅ Add `MatchReaction` model (userId, matchId, emoji)
- ✅ Show reaction picker on MatchCard (🔥 👏 😎 💪 🎉)
- ✅ Display reaction count per emoji
- ✅ Limit 1 reaction per user per match
- ✅ Fetch reactions on mount, optimistic updates

**Files created/modified:**
- `prisma/schema.prisma` - ✅ Add MatchReaction model
- `src/app/api/matches/reactions/route.ts` - ✅ API implementation
- `src/components/ui/MatchReactionButton.tsx` - ✅ Reaction UI component
- `src/components/elo/MatchCard.tsx` - ✅ Add reaction UI
- `src/app/matches/history/page.tsx` - ✅ Enable reactions

---

### 2.4 Season Countdown ✅ IMPLEMENTED
**Trigger:** Dashboard and leaderboard pages

**Implementation:**
- ✅ Fetch current season end date from API
- ✅ Display countdown timer: "12 days left in Season March 2024"
- ✅ Show top 3 leaderboard preview
- ✅ Add urgency messaging: "Less than 3 days! Final push!"

**Files modified:**
- `src/app/dashboard/page.tsx` - ✅ Add season countdown widget
- `src/app/leaderboard/page.tsx` - ✅ Add countdown banner
- `src/app/api/seasons/current/route.ts` - ✅ Return countdown data

---

## Phase 3: High Impact

### 3.1 Activity Feed ✅ IMPLEMENTED
**Trigger:** Dashboard load

**Implementation:**
- ✅ Create Activity model (actor, action, target, metadata, createdAt)
- ✅ Log events: match_completed, achievement_unlocked, rank_up, streak_milestone
- ✅ Fetch recent activities for dashboard
- ✅ Display feed with player avatars and action descriptions

**Files created/modified:**
- `prisma/schema.prisma` - ✅ Add Activity model
- `src/app/api/activity/route.ts` - ✅ Fetch activities
- `src/app/dashboard/page.tsx` - ✅ Display activity feed
- `src/components/ui/ActivityFeed.tsx` - ✅ Activity feed component

---

### 3.2 Tournament Brackets ✅ IMPLEMENTED (ALL FORMATS)
**Implementation:**
- ✅ Create TournamentBracket component
- ✅ Support single-elimination
- ✅ Support double-elimination
- ✅ Support round-robin
- ✅ Support Swiss system
- ✅ Real-time updates as matches complete
- ✅ Animated bracket progression

**Files created:**
- `src/components/tournaments/Bracket.tsx` - ✅
- `src/app/tournaments/[id]/page.tsx` - ✅ Show bracket

---

### 3.3 Challenge System ✅ IMPLEMENTED (ENHANCED)
**Implementation:**
- ✅ Add Challenge model (challengerId, challengedId, stakeAmount, status, deadline)
- ✅ Create challenge API endpoints
- ✅ Show pending challenges on dashboard
- ✅ **Stakes-based system:**
  - ✅ Challenger stakes 5-25 ELO (deducted on create)
  - ✅ Challenged must match stake (deducted on accept)
  - ✅ Winner takes all (gets both stakes back + opponent's stake)
  - ✅ Loser's stake goes to winner
- ✅ **ENHANCED**: Team challenges (only complete in official team matches)

**Challenge Flow:**
1. ✅ Challenger creates challenge → 5-25 ELO deducted (escrow)
2. ✅ Challenged accepts → Must also stake matching amount
3. ✅ Match played → Either player marks complete
4. ✅ Winner → Gets 2x their stake (own + opponent's)
5. ✅ Decline/Cancel → Challenger's stake refunded

**Files created/modified:**
- `prisma/schema.prisma` - ✅ Add Challenge model
- `src/app/api/challenges/route.ts` - ✅ Challenge API
- `src/app/challenges/page.tsx` - ✅ Challenge page
- `src/app/dashboard/page.tsx` - ✅ Show pending challenges

---

## Database Schema Additions

```prisma
// Tier announcement tracking ✅ IMPLEMENTED
model User {
  // ... existing fields ...
  lastAnnouncedTier String?  // ✅ Tracks last announced tier for announcements
  lastKnownRank Int?  // ✅ ADDED
  lastRankUpdate DateTime?  // ✅ ADDED
  weeklySinglesEloGained Int @default(0)  // ✅ ADDED
  weeklyDoublesEloGained Int @default(0)  // ✅ ADDED
  weeklyTeamEloGained Int @default(0)  // ✅ ADDED
}

// Achievement tracking ✅ IMPLEMENTED
model Achievement {
  id String @id @default(cuid())
  slug String @unique
  name String
  desc String
  icon String
  tier String?
  userId String
  user User @relation(fields: [userId], references: [id])
  unlockedAt DateTime @default(now())
  @@unique([userId, slug])
}

// Match reactions ✅ IMPLEMENTED
model MatchReaction {
  id String @id @default(cuid())
  userId String
  matchId String
  emoji String
  createdAt DateTime @default(now())
  @@unique([userId, matchId])
}

// Activity feed ✅ IMPLEMENTED
model Activity {
  id String @id @default(cuid())
  type String
  message String
  metadata Json?
  userId String?
  matchId String?
  createdAt DateTime @default(now())
  @@index([createdAt])
  @@index([userId])
}

// Challenges ✅ IMPLEMENTED (ENHANCED)
model Challenge {
  id String @id @default(cuid())
  challengerId String
  challengedId String
  challenger User @relation("Challenger")
  challenged User @relation("Challenged")
  stakeAmount Int @default(0)
  matchId String? @unique
  match Match? @relation(fields: [matchId])
  status ChallengeStatus @default(PENDING)
  expiresAt DateTime @default(now())
  isTeamChallenge Boolean @default(false)  // ✅ ENHANCED
  team1Id String?  // ✅ ENHANCED
  team2Id String?  // ✅ ENHANCED
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([challengerId])
  @@index([challengedId])
  @@index([status])
}
```

---

## Implementation Status Summary

| Feature | Status |
|---------|--------|
| 1.1 Streak Milestone Celebrations | ✅ Implemented |
| 1.2 ELO Tier Announcements | ✅ Implemented (persisted + toast) |
| 1.3 Win Animation Upgrade | ✅ Implemented |
| 1.4 Leaderboard Rank Changes | ✅ Implemented |
| 2.1 Achievement System | ✅ Implemented |
| 2.2 Weekly Top Climber | ✅ Implemented (10% per mode, resets weekly) |
| 2.3 Match Reactions | ✅ Implemented (UI + API) |
| 2.4 Season Countdown | ✅ Implemented |
| 3.1 Activity Feed | ✅ Implemented |
| 3.2 Tournament Brackets | ✅ Implemented (all formats) |
| 3.3 Challenge System | ✅ Implemented (enhanced: team challenges) |
| 4.1 Sound Effects | ✅ Implemented |
| 4.2 Shareable Match Results | ✅ Implemented |
| 4.3 ELO History Graph | ✅ Implemented |
| 4.4 Head-to-Head Stats | ✅ Implemented |
| Spectator Mode | ❌ N/A (real-life matches, not video) |

---

## Testing Strategy

1. ✅ **Unit tests** for achievement checking logic
2. ✅ **Integration tests** for milestone/tier detection
3. ✅ **UI tests** for animations and toasts
4. ✅ **Manual testing** of all celebration triggers

---

## Rollout Order

1. ✅ Plan file (this document)
2. ✅ Phase 1.1-1.4: Quick wins (minimal risk)
3. ✅ Phase 2.1: Achievement system (self-contained)
4. ✅ Phase 2.2-2.4: Weekly features
5. ✅ Phase 3: High-impact features (larger scope)

---

## Success Metrics

- **DAU/MAU ratio increase** (engagement)
- **Match completion rate** (retention)
- **Streak continuation rate** (habit formation)
- **Achievement unlock rate** (motivation)
- **Season participation** (competition)

---

## Remaining Work

None! All planned features are implemented.

---

## Phase 4: Polish & Social Features (IMPLEMENTED)

### 4.1 Sound Effects ✅ IMPLEMENTED
**Trigger:** Match results, tier ups, streak milestones

**Implementation:**
- ✅ Add audio elements for win/loss sounds
- ✅ Victory fanfare for upsets (beating someone 100+ ELO higher)
- ✅ Tier-up celebration sounds
- ✅ Streak milestone sounds

**Files modified:**
- `src/components/elo/MatchResult.tsx` - ✅ Add audio elements

---

### 4.2 Shareable Match Results ✅ IMPLEMENTED
**Trigger:** After viewing a match result

**Implementation:**
- ✅ Add share button to match result
- ✅ Copy match summary to clipboard
- ✅ Generate shareable text with ELO changes

**Files modified:**
- `src/components/elo/MatchResult.tsx` - ✅ Add share functionality

---

### 4.3 ELO History Graph ✅ IMPLEMENTED
**Trigger:** Profile page load

**Implementation:**
- ✅ Use EloHistory model to fetch ELO changes
- ✅ Display line chart showing ELO progression
- ✅ Highlight tier crossings on graph
- ✅ Show win/loss markers

**Files created/modified:**
- `src/app/profile/[id]/page.tsx` - ✅ Add ELO graph component

---

### 4.4 Head-to-Head Stats ✅ IMPLEMENTED
**Trigger:** User clicks on another player's profile

**Implementation:**
- ✅ New API endpoint for head-to-head stats
- ✅ Display all matches between two players
- ✅ Show win/loss record
- ✅ ELO history against each other
- ✅ Average score differential

**Files created/modified:**
- `src/app/api/players/[id]/head-to-head/route.ts` - ✅ Head-to-head API
- `src/app/profile/[id]/page.tsx` - ✅ Add head-to-head section
