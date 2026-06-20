# PingElo - Ping Pong ELO Tracking Platform

## 1. OBJECTIVE

Build a full-stack ping pong ELO tracking platform where players can create accounts (OAuth + email), log matches, track forever and seasonal ELO, and compete in paid-entry tournaments. The system uses a Postgres/Prisma database with a Next.js frontend.

## 2. CONTEXT SUMMARY

**Tech Stack (based on codebase analysis):**
- **Frontend:** Next.js 16+ (App Router), TypeScript, Tailwind CSS
- **UI Components:** Custom components (Button, Input, Card, etc.) with forwardRef pattern
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **State:** Zustand
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js (Google OAuth + Email/Password)
- **Hosting:** Vercel

**Existing Patterns:**
- JSDoc comments on functions/components
- forwardRef pattern for all UI components
- cn() utility for Tailwind class merging
- Clean separation in /src (app, components, lib, types)

## 3. APPROACH OVERVIEW

### Research Summary

I analyzed 5 major rating systems and their suitability for a small recreational ping pong league (10-50 players):

| System | Best For | Issues for PingElo |
|--------|----------|-------------------|
| **Standard ELO** | Simple, well-understood | No uncertainty modeling, slow convergence |
| **Glicko-2** | Chess.com, lichess, uncertainty tracking | Complex to explain, overkill for small groups |
| **TrueSkill** | Xbox matchmaking, teams | "μ=35.2" means nothing to users, computational overhead |
| **WHR** | Academic accuracy | Can't update in real-time, batch processing only |
| **Modified ELO** | Small frequent-play groups | ✅ Best fit |

### Final Decision: Modified ELO

For 10-50 players who play multiple times per week:
- **Standard ELO is too slow** - takes 30-50 games to converge
- **Glicko adds complexity without value** - users don't care about RD
- **Modified ELO is the sweet spot** - fast convergence + simple explanations

### Rating System: Enhanced ELO

**1. Dynamic K-factor (faster convergence):**
| Games Played | K-factor | Rationale |
|-------------|----------|-----------|
| 0-10 | **64** | Rapid adjustment for new players (was 48 in original plan - corrected) |
| 11-30 | **48** | Still adjusting quickly |
| 31-100 | **32** | Stable, established players |
| 100+ | **24** | Veterans - slow to change |

**2. Score Margin Multiplier (casual matches only):**
| Point Difference | Multiplier | Rationale |
|-----------------|------------|-----------|
| 1-4 points | 1.0x | Close games |
| 5-9 points | 1.25x | Clear win |
| 10+ points | 1.5x | Dominance |
*Note: Tournament matches use 1.0x only (pure win/loss)*

**3. Activity Bonus (prevents ELO stagnation):**
- Play 2+ matches/week: +5 ELO bonus
- Injects fresh ELO, prevents economy stagnation
- Visual "active" badge on profiles

**4. Inactivity Indicator (not penalty):**
- No games for 4+ weeks: Show "rusty" badge
- Doesn't mathematically change rating
- Just informational for opponents

### Tournament Economy: Multi-Place Payouts

**Problem with winner-takes-all:** ELO just redistributes, rich get richer, new players drain.

**Solution: Tiered system with house injection:**

| Feature | Implementation |
|---------|---------------|
| **House ELO injection** | Platform adds 500 ELO to each tournament prize pool |
| **Tiered entry fees** | Below 800 ELO = free, 800-1000 = 10 ELO, 1000-1200 = 20 ELO, 1200+ = 50 ELO |
| **Multi-place payouts** | 1st: 60%, 2nd: 25%, 3rd/4th: 7.5% each |
| **Soft floor** | Below 800 ELO = free tournament entry always |

### Season System

- **Forever ELO:** Never resets, lifetime legacy
- **Season ELO:** Fresh start 1st of each month (UTC)
- **Season champion:** Badge + 10% of season gains added to forever ELO
- **New players:** Start at 1000 both

## 4. IMPLEMENTATION STEPS

### Phase 1: Project Foundation

1. **Setup Prisma with PostgreSQL**
   - Install: `prisma`, `@prisma/client`
   - Configure `DATABASE_URL` environment variable
   - Create initial schema with User, Match, Tournament models
   - Run `prisma migrate dev`

2. **Setup NextAuth.js Authentication**
   - Install: `next-auth`, `@next-auth/prisma-adapter`
   - Configure Google OAuth provider
   - Add email/password support with bcrypt
   - Create admin role in User model
   - Setup auth API routes in `/src/app/api/auth/[...nextauth]/route.ts`

3. **Create Database Schema** (Prisma models)

   ```prisma
   model User {
     id            String    @id @default(cuid())
     email         String    @unique
     name          String
     image         String?
     passwordHash  String?
     role          Role      @default(PLAYER)
     isBanned      Boolean   @default(false)
     banReason     String?
     createdAt     DateTime  @default(now())
     updatedAt     DateTime  @updatedAt
     
     // ELO tracking
     foreverElo    Int       @default(1000)
     seasonElo     Int       @default(1000)
     matchesPlayed Int       @default(0)
     
     // Relationships
     matchesAsP1   Match[]   @relation("Player1")
     matchesAsP2   Match[]   @relation("Player2")
     tournaments   TournamentParticipant[]
   }

   model Match {
     id            String    @id @default(cuid())
     player1Id     String
     player2Id     String
     player1Score  Int       // Must be >= 3 and <= 21
     player2Score  Int       // Must be >= 3 and <= 21
     winnerId      String
     
     // ELO changes at time of match
     player1EloChange Int
     player2EloChange Int
     
     // Metadata
     isTournamentMatch Boolean @default(false)
     tournamentId      String?
     tournament         Tournament? @relation(fields: [tournamentId], references: [id])
     
     // Admin tracking
     createdById   String
     createdAt     DateTime @default(now())
     updatedAt     DateTime @updatedAt
     deletedAt     DateTime? // Soft delete for admin
     
     player1       User      @relation("Player1", fields: [player1Id], references: [id])
     player2       User      @relation("Player2", fields: [player2Id], references: [id])
   }

   model Tournament {
     id              String    @id @default(cuid())
     name            String
     description     String?
     creatorId       String
     
     // Tournament settings
     entryFee        Int       @default(0)      // ELO cost to enter
     prizePool       Int       @default(0)      // House ELO added
     maxScore        Int       @default(21)     // Win condition (3-21)
     format          TournamentFormat @default(SINGLE_ELIMINATION)
     maxParticipants Int       @default(8)
     
     // Status
     status          TournamentStatus @default(DRAFT)
     startsAt        DateTime?
     createdAt       DateTime @default(now())
     updatedAt       DateTime @updatedAt
     
     creator         User      @relation(fields: [creatorId], references: [id])
     participants    TournamentParticipant[]
     matches         Match[]
   }

   model TournamentParticipant {
     id            String    @id @default(cuid())
     tournamentId  String
     userId        String
     eloAtEntry    Int       // Locked at entry time
     paidEntry     Boolean   @default(false)
     paidOut       Boolean   @default(false)
     finalPlacement Int?
     createdAt     DateTime  @default(now())
     
     tournament    Tournament @relation(fields: [tournamentId], references: [id])
     user          User       @relation(fields: [userId], references: [id])
     
     @@unique([tournamentId, userId])
   }

   enum Role {
     PLAYER
     ADMIN
   }

   enum TournamentFormat {
     SINGLE_ELIMINATION
     DOUBLE_ELIMINATION
     ROUND_ROBIN
     SWISS
   }

   enum TournamentStatus {
     DRAFT
     REGISTRATION_OPEN
     IN_PROGRESS
     COMPLETED
     CANCELLED
   }
   ```

### Phase 2: ELO Calculation Engine

4. **Create ELO Calculation Service** (`/src/lib/elo.ts`)

   Implement the Modified ELO system:

   ```typescript
   // K-factor based on games played
   function getKFactor(gamesPlayed: number): number {
     if (gamesPlayed <= 10) return 64;
     if (gamesPlayed <= 30) return 48;
     if (gamesPlayed <= 100) return 32;
     return 24;
   }

   // Score margin multiplier (casual only)
   function getMarginMultiplier(playerScore: number, opponentScore: number): number {
     const margin = Math.abs(playerScore - opponentScore);
     if (margin >= 10) return 1.5;
     if (margin >= 5) return 1.25;
     return 1.0;
   }

   // Expected score calculation
   function getExpectedScore(ratingA: number, ratingB: number): number {
     return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
   }

   // Main ELO calculation
   function calculateEloChange(
     playerRating: number,
     opponentRating: number,
     playerScore: number,      // 1, 0.5, or 0
     playerGamesPlayed: number,
     marginMultiplier: number, // 1.0 for tournament, varies for casual
     isCasual: boolean
   ): { newRating: number; change: number } {
     const K = getKFactor(playerGamesPlayed) * (isCasual ? marginMultiplier : 1.0);
     const expected = getExpectedScore(playerRating, opponentRating);
     const change = Math.round(K * (playerScore - expected));
     return { newRating: playerRating + change, change };
   }
   ```

   Additional features:
   - Activity bonus tracking (+5 ELO for 2+ matches/week)
   - Rusty player indicator for 4+ weeks inactive
   - Support for both casual and tournament match types

5. **Add Season Management** (`/src/lib/seasons.ts`)
   - Check if season needs to roll over (1st of month UTC)
   - Copy foreverElo → seasonElo on season start
   - Apply season champion bonus (10% of gains → forever ELO)
   - Track season start/end dates
   - Query season-specific leaderboards

### Phase 3: Match System

6. **Match Entry API** (`/src/app/api/matches/route.ts`)
   - POST: Create new match
     - Validate both players are not banned
     - Validate scores (3-21, winner must have higher score)
     - Calculate ELO changes
     - Update both players' ELO (forever and season)
     - Increment matchesPlayed
   - GET: List matches (with pagination, filters)
   - DELETE: Admin-only soft delete

7. **Match Entry UI** (`/src/app/matches/new/page.tsx`)
   - Form to select player 1, player 2, enter scores
   - Auto-determine winner from scores
   - Show projected ELO changes before confirming
   - Confirm modal for both players (or just creator for quick entry)

### Phase 4: Tournament System

8. **Tournament API**
   - `POST /api/tournaments` - Create tournament
   - `GET /api/tournaments` - List tournaments
   - `POST /api/tournaments/[id]/join` - Join tournament (deduct ELO based on tier)
   - `POST /api/tournaments/[id]/start` - Start tournament (admin or creator)
   - `POST /api/tournaments/[id]/matches` - Submit match result
   - `DELETE /api/tournaments/[id]` - Cancel (admin only, refund ELO)

   **Tournament Entry Fee Logic:**
   ```typescript
   function getEntryFee(elo: number): number {
     if (elo < 800) return 0;           // Free for low ELO
     if (elo < 1000) return 10;         // 10 ELO
     if (elo < 1200) return 20;         // 20 ELO
     return 50;                          // 50 ELO for high ELO players
   }

   function calculatePrizePool(participants: number, avgElo: number): number {
     // Base pool from entry fees + house injection
     const houseInjection = 500; // Platform adds 500 ELO per tournament
     return participants * avgElo + houseInjection;
   }

   function distributePrizes(pool: number): { placement: number; percentage: number }[] {
     return [
       { placement: 1, percentage: 0.60 },  // 60% to winner
       { placement: 2, percentage: 0.25 },  // 25% to runner-up
       { placement: 3, percentage: 0.075 }, // 7.5% to 3rd
       { placement: 4, percentage: 0.075 }, // 7.5% to 4th
     ];
   }
   ```

9. **Tournament Bracket Generator** (`/src/lib/tournaments.ts`)
   - Generate brackets based on format:
     - **<6 players:** Round Robin (everyone plays everyone)
     - **6-16 players:** Swiss system (best matchmaking)
     - **16+ players:** Double elimination (fairer, less bracket luck)
   - Seeding based on current ELO
   - Automatic pairing for round 1 based on ELO distribution

10. **Tournament UI Pages**
    - `/tournaments` - Browse and create tournaments
    - `/tournaments/[id]` - View bracket, enter results
    - Tournament creator configures entry fee, max score, format

### Phase 5: Admin Tools

11. **Admin Dashboard** (`/src/app/admin/page.tsx`)
    - View all matches with ability to filter/delete
    - Recalculate ELO button: Replays all non-deleted matches for a user
    - Move match: Change match date or reassign players
    - Ban/unban users
    - Override tournament results

12. **Admin API Routes**
    - `DELETE /api/admin/matches/[id]` - Soft delete match
    - `PUT /api/admin/matches/[id]` - Edit match (recalculate ELO)
    - `POST /api/admin/recalculate/[userId]` - Full ELO recalculation
    - `PUT /api/admin/users/[id]/ban` - Ban user

### Phase 6: User Features

13. **Leaderboard Pages**
    - `/leaderboard` - Forever ELO rankings
    - `/leaderboard/season` - Current season rankings
    - Show top 100, with pagination

14. **Player Profile Page** (`/src/app/profile/[id]/page.tsx`)
    - ELO history graph
    - Match history with win/loss
    - Tournament results
    - Head-to-head records

15. **User Dashboard** (`/src/app/dashboard/page.tsx`)
    - Recent matches
    - Upcoming tournaments
    - Quick stats (win rate, ELO trend)

### Phase 7: Polish & Edge Cases

16. **Anti-Fraud Measures**
    - Rate limiting on match entry (max 10/day per user)
    - Require both players to confirm (optional setting)
    - Admin notification on suspicious patterns

17. **Notifications/Toasts**
    - Use existing react-hot-toast pattern
    - Notify on ELO changes, tournament invites

18. **Responsive Design**
    - Mobile-friendly bracket views
    - Touch-friendly match entry

### Phase 8: User Education & Transparency

This is critical - all ELO mechanics must be **visible and explainable** to users.

19. **ELO Information Pages** (`/src/app/elo/page.tsx`)

   Dedicated page explaining the rating system:

   ```
   ┌─────────────────────────────────────────────────────────────┐
   │  HOW PINGELO ELO WORKS                                     │
   ├─────────────────────────────────────────────────────────────┤
   │                                                             │
   │  Your ELO changes after every match. Here's how:           │
   │                                                             │
   │  THE FORMULA                                                │
   │  ┌─────────────────────────────────────────────────────┐   │
   │  │ New Rating = Old Rating + K × (Your Score - Expected)│   │
   │  │                                                     │   │
   │  │ Where:                                               │   │
   │  │ • Your Score = 1 (win), 0.5 (draw), 0 (loss)        │   │
   │  │ • Expected = 1 / (1 + 10^((opponent - you) / 400)) │   │
   │  │ • K = Based on your experience (see below)          │   │
   │  └─────────────────────────────────────────────────────┘   │
   │                                                             │
   │  K-FACTOR (HOW FAST YOUR RATING CHANGES)                   │
   │  ┌─────────────────────────────────────────────────────┐   │
   │  │ 0-10 games:   K = 64 (rapid adjustment)             │   │
   │  │ 11-30 games:  K = 48 (still learning)               │   │
   │  │ 31-100 games: K = 32 (established)                  │   │
   │  │ 100+ games:   K = 24 (veteran, slow to change)     │   │
   │  └─────────────────────────────────────────────────────┘   │
   │                                                             │
   │  EXAMPLES                                                   │
   │  ┌─────────────────────────────────────────────────────┐   │
   │  │ You (1000) vs Opponent (1000):                     │   │
   │  │ • Win: +32 ELO  • Loss: -32 ELO                    │   │
   │  │                                                     │   │
   │  │ You (1200) vs Opponent (800):                      │   │
   │  │ • Win: +8 ELO   • Loss: -40 ELO (upset = big swing)│   │
   │  │                                                     │   │
   │  │ You (800) vs Opponent (1200):                       │   │
   │  │ • Win: +40 ELO  • Loss: -8 ELO (giant killer!)     │   │
   │  └─────────────────────────────────────────────────────┘   │
   │                                                             │
   │  SCORE MARGIN BONUS (CASUAL MATCHES ONLY)                  │
   │  ┌─────────────────────────────────────────────────────┐   │
   │  │ Win by 1-4 points:  No bonus (1.0x)                 │   │
   │  │ Win by 5-9 points:  +25% ELO change (1.25x)        │   │
   │  │ Win by 10+ points: +50% ELO change (1.5x)           │   │
   │  │                                                     │   │
   │  │ Example: 21-8 counts more than 21-19!               │   │
   │  │ Note: Tournament matches use 1.0x only              │   │
   │  └─────────────────────────────────────────────────────┘   │
   │                                                             │
   │  ACTIVITY BONUS                                             │
   │  ┌─────────────────────────────────────────────────────┐   │
   │  │ Play 2+ matches per week: +5 ELO bonus              │   │
   │  │ Keeps the economy healthy & rewards active players   │   │
   │  └─────────────────────────────────────────────────────┘   │
   │                                                             │
   │  RUSTY PLAYERS                                             │
   │  ┌─────────────────────────────────────────────────────┐   │
   │  │ No matches for 4+ weeks? You'll see a "Rusty" badge│   │
   │  │ This doesn't change your ELO, just warns opponents  │   │
   │  └─────────────────────────────────────────────────────┘   │
   └─────────────────────────────────────────────────────────────┘
   ```

20. **In-Interface Explanations**

   Every ELO-related element shows a help tooltip:

   ```tsx
   // Example: Match card showing ELO change
   <div className="flex items-center gap-2">
     <span className="text-green-600">+32 ELO</span>
     <Tooltip content="You won! K=64 (new player), margin 21-18 (1.0x), expected was 50%, actual 100%">
       <HelpCircle className="w-4 h-4 text-gray-400" />
     </Tooltip>
   </div>

   // Example: Leaderboard rank explanation
   <div>
     <span className="font-bold">#3</span>
     <Tooltip content="Your K-factor is now 32 (31-100 games played). Veterans with 100+ games use K=24.">
       <Info className="w-4 h-4" />
     </Tooltip>
   </div>

   // Example: Profile stats
   <StatCard
     label="Current ELO"
     value={1156}
     tooltip="This reflects all your matches since joining. Your season ELO started fresh this month."
   />
   ```

21. **Pre-Match ELO Preview** (`/src/app/matches/new/page.tsx`)

   Before confirming a match, show projected ELO changes:

   ```
   ┌─────────────────────────────────────────────────────────────┐
   │  MATCH PREVIEW                                            │
   ├─────────────────────────────────────────────────────────────┤
   │                                                             │
   │  You (1000) vs Alex (1050)                                 │
   │  Your score: 21    Alex score: 18                          │
   │                                                             │
   │  ───────────────────────────────────────────────────────   │
   │                                                             │
   │  IF YOU WIN:                                               │
   │  ┌─────────────────────────────────────────────────────┐   │
   │  │ • ELO Change: +27 (rounded from +27.3)              │   │
   │  │ • Your new ELO: 1027                                │   │
   │  │ • Why: K=64, margin=3 (1.0x), expected win=47%     │   │
   │  └─────────────────────────────────────────────────────┘   │
   │                                                             │
   │  IF YOU LOSE:                                              │
   │  ┌─────────────────────────────────────────────────────┐   │
   │  │ • ELO Change: -20 (rounded from -19.7)              │   │
   │  │ • Your new ELO: 980                                  │   │
   │  │ • Why: K=64, margin=3 (1.0x), expected loss=53%     │   │
   │  └─────────────────────────────────────────────────────┘   │
   │                                                             │
   │  [Confirm Match]                                            │
   │                                                             │
   └─────────────────────────────────────────────────────────────┘
   ```

22. **Tournament Cost/Payout Calculator**

   When creating or joining a tournament:

   ```
   ┌─────────────────────────────────────────────────────────────┐
   │  TOURNAMENT: Friday Night Finals                           │
   ├─────────────────────────────────────────────────────────────┤
   │                                                             │
   │  Your ELO: 1150                                            │
   │  Entry Fee: 20 ELO (1000-1200 tier)                       │
   │  House Injection: +500 ELO added by platform               │
   │                                                             │
   │  ───────────────────────────────────────────────────────   │
   │                                                             │
   │  PRIZE POOL BREAKDOWN                                      │
   │  ┌─────────────────────────────────────────────────────┐   │
   │  │ Total Pool: 1260 ELO                                │   │
   │  │                                                       │   │
   │  │ 🥇 1st Place: 756 ELO  (60%)                        │   │
   │  │ 🥈 2nd Place: 315 ELO  (25%)                        │   │
   │  │ 🥉 3rd Place:  94 ELO  (7.5%)                       │   │
   │  │ 4th Place:    94 ELO  (7.5%)                       │   │
   │  └─────────────────────────────────────────────────────┘   │
   │                                                             │
   │  IF YOU WIN:                                               │
   │  • Net ELO: +736 (756 prize - 20 entry)                   │
   │  • Plus regular ELO gain from matches                     │
   │                                                             │
   │  [Join Tournament - Pay 20 ELO]                           │
   │                                                             │
   └─────────────────────────────────────────────────────────────┘
   ```

23. **Season Progress & Comparison**

   On user dashboard and profile:

   ```
   ┌─────────────────────────────────────────────────────────────┐
   │  SEASON: June 2025                                         │
   ├─────────────────────────────────────────────────────────────┤
   │                                                             │
   │  Season ELO: 1156                                          │
   │  Started at: 1000 | +156 this season                       │
   │                                                             │
   │  ┌─────────────────────────────────────────────────────┐   │
   │  │ ●───────────────────────────────────────● Current    │   │
   │  │ 1000                                    1156         │   │
   │  └─────────────────────────────────────────────────────┘   │
   │                                                             │
   │  Forever ELO: 1189                                         │
   │  (Your all-time ranking across all seasons)                │
   │                                                             │
   │  Season Champion Bonus: +16 ELO                            │
   │  (10% of your season gains: 156 × 0.10 = 15.6 → 16)      │
   │  Applied when season ends!                                 │
   │                                                             │
   └─────────────────────────────────────────────────────────────┘
   ```

24. **Help Center / FAQ** (`/src/app/help/page.tsx`)

   Comprehensive help covering:
   - How ELO works (with visual examples)
   - How tournaments work
   - How seasons work
   - Why did my ELO change by X?
   - What does "Rusty" mean?
   - How do I raise my ELO?
   - Fair play & dispute resolution
   - Account & profile settings

25. **Visual ELO History Graph**

   On player profile:

   ```
   ┌─────────────────────────────────────────────────────────────┐
   │  ELO HISTORY - Last 30 Matches                              │
   ├─────────────────────────────────────────────────────────────┤
   │                                                             │
   │  1200 ┤                              ●──●                  │
   │       │                         ●──●                       │
   │  1150 ┤                    ●──●                             │
   │       │               ●──●                                 │
   │  1100 ┤          ●──●                                       │
   │       │     ●──●                                           │
   │  1050 ┤●──●                                                 │
   │       └────┴────┴────┴────┴────┴────┴────┴────┴────┴────   │
   │        M1   M5   M10  M15  M20  M25  M30                    │
   │                                                             │
   │  Trend: 📈 +150 ELO (from 1000 to 1150)                    │
   │  Last 10: +32, +27, -15, +48, +12, -8, +35, +24, +16, +20 │
   │                                                             │
   └─────────────────────────────────────────────────────────────┘
   ```

   Each point shows tooltip on hover: "Won vs Alex (1050) 21-18. K=64, +32 ELO"

26. **Match Confirmation Transparency**

   When viewing a match result:

   ```
   ┌─────────────────────────────────────────────────────────────┐
   │  MATCH RESULT                                              │
   ├─────────────────────────────────────────────────────────────┤
   │                                                             │
   │  You (21) vs Alex (18)                                     │
   │  Winner: You                                                │
   │  Date: June 15, 2025                                       │
   │  Type: Casual Match                                        │
   │                                                             │
   │  ───────────────────────────────────────────────────────   │
   │                                                             │
   │  ELO IMPACT                                                 │
   │  ┌─────────────────────────────────────────────────────┐   │
   │  │ Your ELO: 1000 → 1032 (+32)                         │   │
   │  │                                                       │   │
   │  │ Calculation:                                         │   │
   │  │ • K-factor: 64 (you have 8 games)                  │   │
   │  │ • Score margin: 3 points (1.0x multiplier)         │   │
   │  │ • Your expected win: 48%                           │   │
   │  │ • Your actual result: 100% (win)                   │   │
   │  │ • Raw change: 64 × (1.0 - 0.48) = +33.3 → +32     │   │
   │  │                                                       │   │
   │  │ Alex's ELO: 1050 → 1018 (-32)                       │   │
   │  │ (Symmetric loss)                                    │   │
   │  └─────────────────────────────────────────────────────┘   │
   │                                                             │
   │  Note: Tournament matches don't use score margin bonus.    │
   │                                                             │
   └─────────────────────────────────────────────────────────────┘
   ```

### Implementation Notes

All explanatory content should:
- Use **plain language** (no jargon like "Rating Deviation" or "Glicko-2")
- Show **concrete numbers** (not just "you won, so you gained ELO")
- Be **always visible** (tooltips, expandable sections, dedicated pages)
- Include **visual aids** (graphs, charts, color-coded examples)
- Respect **user intelligence** (show the math, don't dumb it down)

## 5. TESTING AND VALIDATION

### Unit Tests (`/src/test/` - expand existing setup)

**ELO Calculation Tests:**
```typescript
// Test K-factor selection
expect(getKFactor(5)).toBe(64);   // New player
expect(getKFactor(20)).toBe(48);  // Still adjusting
expect(getKFactor(50)).toBe(32);  // Established
expect(getKFactor(150)).toBe(24); // Veteran

// Test margin multiplier
expect(getMarginMultiplier(21, 19)).toBe(1.0);   // 2-point win
expect(getMarginMultiplier(21, 15)).toBe(1.25); // 6-point win
expect(getMarginMultiplier(21, 8)).toBe(1.5);   // 13-point win

// Test expected score
expect(getExpectedScore(1000, 1000)).toBe(0.5);  // Equal players

// Test ELO change calculation
// 1000 vs 1000, new player (K=64), win, casual, margin 21-19
const result = calculateEloChange(1000, 1000, 1, 5, 1.0, true);
// Should be approximately +32 (64 * (1 - 0.5))
```

**Test Cases for ELO Changes:**
| Scenario | K | Win/Loss | Margin | Expected Change |
|----------|---|----------|--------|-----------------|
| 1000 vs 1000, new player, casual 21-19 | 64 | Win | 1.0x | ~+32 |
| 1000 vs 1000, new player, casual 21-8 | 64 | Win | 1.5x | ~+48 |
| 1200 vs 800, established, tournament | 32 | Win | 1.0x | ~+8 |
| 800 vs 1200, new player, casual 21-19 | 64 | Loss | 1.0x | ~-32 |
| 1000 vs 1000, veteran, casual 21-19 | 24 | Win | 1.0x | ~+12 |

### Integration Tests
- Match creation flow: Create match → verify ELO updates → verify in database
- Activity bonus: Play 2+ matches in a week → verify +5 ELO bonus applied
- Tournament flow: Create → join (ELO deducted) → start → complete → verify multi-place payout
- Admin recalculation: Delete match → recalculate → verify correct ELO

### Manual Testing Checklist
- [ ] Sign up with Google OAuth
- [ ] Sign up with email/password
- [ ] Enter a match (valid scores 3-21)
- [ ] Enter a match (invalid scores - should reject)
- [ ] Verify score margin affects ELO change (21-3 vs 21-19)
- [ ] View leaderboard updates
- [ ] Create tournament with entry fee
- [ ] Join tournament (ELO deducted based on tier)
- [ ] Complete tournament (ELO distributed per payout structure)
- [ ] Verify "rusty" badge appears after 4 weeks inactive
- [ ] Admin: Delete match, verify ELO recalculates
- [ ] Admin: Recalculate user ELO from scratch
- [ ] Verify season rollover (or mock date)
- [ ] Test banned user cannot enter matches
- [ ] Mobile responsiveness
