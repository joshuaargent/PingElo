/**
 * Match Helper Functions
 * Shared utilities for match-related operations
 */
import prisma from "@/lib/prisma";

/**
 * Calculate team streak based on last match date
 */
export function calculateTeamStreak(currentStreak: number, longestStreak: number, lastMatchDate: Date | null): { newStreak: number; newLongestStreak: number } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (!lastMatchDate) {
    // First match ever
    return { newStreak: 1, newLongestStreak: Math.max(longestStreak, 1) };
  }
  
  const lastDate = new Date(lastMatchDate.getFullYear(), lastMatchDate.getMonth(), lastMatchDate.getDate());
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Same day - streak stays the same
    return { newStreak: currentStreak, newLongestStreak: longestStreak };
  } else if (diffDays === 1) {
    // Consecutive day - increment streak
    const newStreak = currentStreak + 1;
    return { newStreak, newLongestStreak: Math.max(longestStreak, newStreak) };
  } else if (diffDays <= 3) {
    // Grace period of 3 days
    const newStreak = currentStreak + 1;
    return { newStreak, newLongestStreak: Math.max(longestStreak, newStreak) };
  } else {
    // Streak broken - reset to 1
    return { newStreak: 1, newLongestStreak: longestStreak };
  }
}

/**
 * Update team streaks after a match
 */
export async function updateTeamStreaks(team1Id: string | null, team2Id: string | null) {
  const now = new Date();
  
  if (team1Id) {
    const team1 = await prisma.team.findUnique({ where: { id: team1Id } });
    if (team1) {
      const streakResult = calculateTeamStreak(team1.currentStreak, team1.longestStreak, team1.lastMatchDate);
      await prisma.team.update({
        where: { id: team1Id },
        data: {
          currentStreak: streakResult.newStreak,
          longestStreak: streakResult.newLongestStreak,
          lastMatchDate: now,
        },
      });
    }
  }
  
  if (team2Id) {
    const team2 = await prisma.team.findUnique({ where: { id: team2Id } });
    if (team2) {
      const streakResult = calculateTeamStreak(team2.currentStreak, team2.longestStreak, team2.lastMatchDate);
      await prisma.team.update({
        where: { id: team2Id },
        data: {
          currentStreak: streakResult.newStreak,
          longestStreak: streakResult.newLongestStreak,
          lastMatchDate: now,
        },
      });
    }
  }
}

/**
 * Auto-complete challenges when a match is played between players with active challenges
 * 
 * IMPORTANT: Team challenges only complete in official team matches (tournaments).
 * Ad hoc doubles do NOT trigger team challenge completion.
 */
export async function autoCompleteChallenges(
  player1Id: string,
  player2Id: string,
  winnerId: string,
  matchId: string,
  matchType: 'SINGLES' | 'DOUBLES',
  team1Player1Id?: string,
  team1Player2Id?: string,
  team2Player1Id?: string,
  team2Player2Id?: string
) {
  try {
    // For singles: check for non-team challenges between the two players
    if (matchType === 'SINGLES') {
      // Find pending NON-team challenges between these two players
      const challenges = await prisma.challenge.findMany({
        where: {
          status: 'ACCEPTED',
          isTeamChallenge: false, // Only non-team challenges for singles
          OR: [
            { challengerId: player1Id, challengedId: player2Id },
            { challengerId: player2Id, challengedId: player1Id },
          ],
        },
        include: {
          challenger: { select: { id: true, name: true } },
          challenged: { select: { id: true, name: true } },
        },
      });

      // Complete each challenge
      for (const challenge of challenges) {
        const totalPayout = challenge.stakeAmount * 2;

        // Get current ELO before update
        const winner = await prisma.user.findUnique({
          where: { id: winnerId },
          select: { foreverElo: true },
        });

        // Pay out to winner
        await prisma.user.update({
          where: { id: winnerId },
          data: { foreverElo: { increment: totalPayout } },
        });

        // Record in ELO history
        await prisma.eloHistory.create({
          data: {
            userId: winnerId,
            changeType: 'CHALLENGE_WIN',
            eloBefore: winner?.foreverElo || 0,
            eloAfter: (winner?.foreverElo || 0) + totalPayout,
            change: totalPayout,
            description: `Challenge win vs ${winnerId === challenge.challengerId ? challenge.challenged.name : challenge.challenger.name}`,
            metadata: { challengeId: challenge.id, stakeAmount: challenge.stakeAmount },
          },
        });

        // Mark challenge as completed
        await prisma.challenge.update({
          where: { id: challenge.id },
          data: { status: 'COMPLETED', winnerId, matchId },
        });
      }
    } else {
      // For ad hoc doubles (no official teams), skip team challenges entirely
      // Team challenges can ONLY be completed in official team matches
      if (!team1Player1Id || !team2Player1Id) {
        // Ad hoc doubles - skip all challenges
        return;
      }

      // This is an official team match (tournament doubles)
      // Only complete team challenges where teams match
      const team1Players = [team1Player1Id, team1Player2Id].filter(Boolean) as string[];
      const team2Players = [team2Player1Id, team2Player2Id].filter(Boolean) as string[];
      const winnerTeam = winnerId === team1Player1Id || winnerId === team1Player2Id ? team1Players : team2Players;
      const loserTeam = winnerTeam === team1Players ? team2Players : team1Players;

      // Find pending team challenges between matching teams
      const challenges = await prisma.challenge.findMany({
        where: {
          status: 'ACCEPTED',
          isTeamChallenge: true,
          OR: [
            // Team 1 challenger vs Team 2 challenged
            { challengerId: { in: team1Players }, challengedId: { in: team2Players }, team1Id: team1Player1Id, team2Id: team2Player1Id },
            // Team 2 challenger vs Team 1 challenged  
            { challengerId: { in: team2Players }, challengedId: { in: team1Players }, team1Id: team1Player1Id, team2Id: team2Player1Id },
          ],
        },
        include: {
          challenger: { select: { id: true, name: true } },
          challenged: { select: { id: true, name: true } },
        },
      });

      for (const challenge of challenges) {
        const totalPayout = challenge.stakeAmount * 2;

        // Find the winner among the team members
        const winnerPlayerId = winnerTeam.find(id => 
          challenge.challengerId === id || challenge.challengedId === id
        ) || winnerId;

        // Get current ELO before update
        const winner = await prisma.user.findUnique({
          where: { id: winnerPlayerId },
          select: { foreverElo: true },
        });

        // Pay out to winner
        await prisma.user.update({
          where: { id: winnerPlayerId },
          data: { foreverElo: { increment: totalPayout } },
        });

        // Record in ELO history
        await prisma.eloHistory.create({
          data: {
            userId: winnerPlayerId,
            changeType: 'CHALLENGE_WIN',
            eloBefore: winner?.foreverElo || 0,
            eloAfter: (winner?.foreverElo || 0) + totalPayout,
            change: totalPayout,
            description: `Team challenge win vs ${winnerPlayerId === challenge.challengerId ? challenge.challenged.name : challenge.challenger.name}`,
            metadata: { challengeId: challenge.id, stakeAmount: challenge.stakeAmount, matchType: 'TEAM_DOUBLES' },
          },
        });

        // Mark challenge as completed
        await prisma.challenge.update({
          where: { id: challenge.id },
          data: { status: 'COMPLETED', winnerId: winnerPlayerId, matchId },
        });
      }
    }
  } catch (error) {
    console.error('Error auto-completing challenges:', error);
  }
}
