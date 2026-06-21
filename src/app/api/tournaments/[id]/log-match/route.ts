/**
 * Tournament Match Log API Route
 * Records match result and advances bracket
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";
import { TOURNAMENT_PRIZE_DISTRIBUTION } from "@/lib/elo";
import { autoCompleteChallenges, updateTeamStreaks } from "@/lib/match-helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await getSessionOrUnauthorized();
    if (response) return response;

    const { id: tournamentId } = await params;
    const body = await request.json();
    const { 
      player1Id, 
      player2Id, 
      player1Score, 
      player2Score, 
      winnerId,
      round,
      position
    } = body;

    // Validate required fields
    if (!player1Id || !player2Id || player1Score === undefined || player2Score === undefined || !winnerId) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Get tournament to check match type
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        brackets: {
          orderBy: { round: 'asc' },
        },
        participants: {
          include: {
            user: { select: { id: true, foreverElo: true, seasonElo: true } },
            team: { 
              include: { 
                player1: { select: { id: true, foreverElo: true, seasonElo: true } },
                player2: { select: { id: true, foreverElo: true, seasonElo: true } },
              }
            },
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    if (tournament.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: "Tournament is not in progress" },
        { status: 400 }
      );
    }

    const isDoubles = tournament.matchType === 'DOUBLES';

    // Validate winner
    if (winnerId !== player1Id && winnerId !== player2Id) {
      return NextResponse.json(
        { error: "Winner must be one of the players" },
        { status: 400 }
      );
    }

    // Validate scores - max is tournament's maxScore (capped at 21)
    const tourneyMaxScore = tournament.maxScore || 21;
    if (player1Score < 0 || player2Score < 0 || player1Score > 21 || player2Score > 21) {
      return NextResponse.json(
        { error: "Invalid scores" },
        { status: 400 }
      );
    }

    // Validate win condition
    const winnerScore = winnerId === player1Id ? player1Score : player2Score;
    const loserScore = winnerId === player1Id ? player2Score : player1Score;
    
    // Must reach exactly maxScore to win, and win by 2
    if (winnerScore !== tourneyMaxScore || winnerScore - loserScore < 2) {
      return NextResponse.json(
        { error: `Must win by 2 with exactly ${tourneyMaxScore} points.` },
        { status: 400 }
      );
    }

    // Get player data based on match type
    let player1: any, player2: any, winner: any, loser: any;
    
    if (isDoubles) {
      // For doubles, IDs are team IDs
      const team1 = tournament.participants.find(p => p.teamId === player1Id)?.team;
      const team2 = tournament.participants.find(p => p.teamId === player2Id)?.team;
      const winningTeam = tournament.participants.find(p => p.teamId === winnerId)?.team;
      
      if (!team1 || !team2 || !winningTeam) {
        return NextResponse.json(
          { error: "Team not found in tournament" },
          { status: 400 }
        );
      }
      
      player1 = team1;
      player2 = team2;
      winner = winningTeam;
      loser = winnerId === player1Id ? team2 : team1;
    } else {
      // For singles, IDs are user IDs
      const user1 = tournament.participants.find(p => p.userId === player1Id)?.user;
      const user2 = tournament.participants.find(p => p.userId === player2Id)?.user;
      
      if (!user1 || !user2) {
        return NextResponse.json(
          { error: "Player not found in tournament" },
          { status: 400 }
        );
      }
      
      player1 = user1;
      player2 = user2;
      winner = winnerId === player1Id ? user1 : user2;
      loser = winnerId === player1Id ? user2 : user1;
    }

    if (!player1 || !player2) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 400 }
      );
    }

    // Simple ELO calculation
    // K-factor
    const k = 32;
    const winnerChange = Math.round(k * 0.5); // Simplified: always +16
    const loserChange = Math.round(k * -0.5); // Simplified: always -16

    // Create match record
    const matchData: any = {
      player1Score,
      player2Score,
      winnerId,
      createdById: winnerId,
      isTournamentMatch: true,
    };

    if (isDoubles) {
      matchData.team1Id = player1Id;
      matchData.team2Id = player2Id;
      matchData.team1EloBefore = player1.foreverElo;
      matchData.team2EloBefore = player2.foreverElo;
      matchData.team1EloChange = winnerId === player1Id ? winnerChange : loserChange;
      matchData.team2EloChange = winnerId === player2Id ? winnerChange : loserChange;
    } else {
      matchData.player1Id = player1Id;
      matchData.player2Id = player2Id;
      matchData.player1EloBefore = player1.foreverElo;
      matchData.player2EloBefore = player2.foreverElo;
      matchData.player1EloChange = winnerId === player1Id ? winnerChange : loserChange;
      matchData.player2EloChange = winnerId === player2Id ? winnerChange : loserChange;
    }

    const match = await prisma.match.create({
      data: matchData,
    });

    // Update ELOs based on match type
    if (isDoubles) {
      // Update team ELOs
      await prisma.team.update({
        where: { id: winnerId },
        data: { foreverElo: { increment: winnerChange } },
      });
      await prisma.team.update({
        where: { id: loser.id },
        data: { foreverElo: { increment: loserChange } },
      });
      
      // Update individual player weekly stats for doubles
      const winnerTeam = await prisma.team.findUnique({
        where: { id: winnerId },
        select: { player1Id: true, player2Id: true }
      });
      const loserTeam = await prisma.team.findUnique({
        where: { id: loser.id },
        select: { player1Id: true, player2Id: true }
      });
      
      if (winnerTeam) {
        for (const pid of [winnerTeam.player1Id, winnerTeam.player2Id].filter(Boolean)) {
          await prisma.user.update({
            where: { id: pid! },
            data: {
              weeklyDoublesMatches: { increment: 1 },
              weeklyDoublesEloGained: { increment: Math.max(0, winnerChange) },
            },
          });
        }
      }
      if (loserTeam) {
        for (const pid of [loserTeam.player1Id, loserTeam.player2Id].filter(Boolean)) {
          await prisma.user.update({
            where: { id: pid! },
            data: {
              weeklyDoublesMatches: { increment: 1 },
              weeklyDoublesEloGained: { increment: Math.max(0, loserChange) },
            },
          });
        }
      }
    } else {
      // Update user ELOs
      await prisma.user.update({
        where: { id: winnerId },
        data: { 
          foreverElo: { increment: winnerChange },
          seasonElo: { increment: winnerChange },
          matchesPlayed: { increment: 1 },
          weeklySinglesMatches: { increment: 1 },
          weeklySinglesEloGained: { increment: Math.max(0, winnerChange) },
        },
      });
      await prisma.user.update({
        where: { id: loser.id },
        data: { 
          foreverElo: { increment: loserChange },
          seasonElo: { increment: loserChange },
          matchesPlayed: { increment: 1 },
          weeklySinglesMatches: { increment: 1 },
          weeklySinglesEloGained: { increment: Math.max(0, loserChange) },
        },
      });
    }

    // Find and update the bracket slot
    const bracketSlot = tournament.brackets.find(
      b => b.round === round && b.position === position
    );

    if (bracketSlot) {
      await prisma.tournamentBracket.update({
        where: { id: bracketSlot.id },
        data: { matchId: match.id },
      });
    }

    // Update bracket slot with winner
    if (bracketSlot) {
      await prisma.tournamentBracket.update({
        where: { id: bracketSlot.id },
        data: { 
          matchId: match.id,
          winnerId: winnerId,
        },
      });
    }

    // Advance winner to next round
    const currentBracketType = bracketSlot?.bracketType || 'winner';
    
    if (currentBracketType === 'winner' || currentBracketType === 'loser') {
      const nextRound = (round || 1) + 1;
      const nextPosition = Math.ceil(position / 2);
      
      // Find next bracket slot
      let nextSlot = tournament.brackets.find(
        b => b.round === nextRound && b.position === nextPosition
      );
      
      if (nextSlot) {
        // Advance winner to next bracket position
        const isFirstSlot = position % 2 === 1;
        
        if (isFirstSlot && !nextSlot.player1Id) {
          await prisma.tournamentBracket.update({
            where: { id: nextSlot.id },
            data: { player1Id: winnerId },
          });
        } else if (!isFirstSlot && !nextSlot.player2Id) {
          await prisma.tournamentBracket.update({
            where: { id: nextSlot.id },
            data: { player2Id: winnerId },
          });
        }
      }
      
      // For double elimination - handle loser bracket
      if (currentBracketType === 'winner' && tournament.format === 'DOUBLE_ELIMINATION') {
        // Find corresponding loser bracket slot (simplified - just mark loser bracket)
        const totalParticipants = tournament.brackets.filter(b => b.bracketType === 'winner' && b.round === 1).length;
        const loserRound = round + totalParticipants;
        
        const loserSlot = tournament.brackets.find(
          b => b.bracketType === 'loser' && b.round === loserRound && b.position === position
        );
        if (loserSlot) {
          // Loser advances to loser bracket
          const isFirstSlot = position % 2 === 1;
          if (isFirstSlot && !loserSlot.player1Id) {
            await prisma.tournamentBracket.update({
              where: { id: loserSlot.id },
              data: { player1Id: loser.id },
            });
          } else if (!isFirstSlot && !loserSlot.player2Id) {
            await prisma.tournamentBracket.update({
              where: { id: loserSlot.id },
              data: { player2Id: loser.id },
            });
          }
        }
      }
    }

    // Check if tournament is complete
    // For single elimination: check if grand finals winner bracket is done
    // For round robin: check if all matches are complete
    const allMatchesComplete = tournament.brackets
      .filter(b => b.player1Id && b.player2Id && !b.matchId)
      .length === 0;
    
    const hasFinalMatch = tournament.brackets.some(
      b => !b.bracketType || b.bracketType === 'winner'
    ) && tournament.brackets
      .filter(b => b.round === Math.max(...tournament.brackets.map(x => x.round)))
      .every(b => b.matchId);

    if (allMatchesComplete || hasFinalMatch) {
      // Tournament complete! Distribute prizes based on placement
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'COMPLETED' },
      });

      if (tournament.prizePool) {
        const prizePool = tournament.prizePool;
        const { first, second, third } = TOURNAMENT_PRIZE_DISTRIBUTION;
        
        // Find the final bracket (last round)
        const maxRound = Math.max(...tournament.brackets.map(b => b.round));
        const finalBracket = tournament.brackets.filter(
          b => b.round === maxRound && (!b.bracketType || b.bracketType === 'winner')
        );
        
        // Final match is the last one in the final bracket that has a matchId
        const finalMatch = finalBracket.find(b => b.matchId);
        
        if (finalMatch) {
          // Get the match to find 1st and 2nd place
          const finalMatchRecord = await prisma.match.findUnique({
            where: { id: finalMatch.matchId! },
          });
          
          if (finalMatchRecord) {
            const firstPlaceId = finalMatchRecord.winnerId;
            const secondPlaceId = firstPlaceId === finalMatchRecord.player1Id 
              ? finalMatchRecord.player2Id 
              : finalMatchRecord.player1Id;
            
            // Distribute prizes for singles
            if (!isDoubles) {
              await prisma.user.update({
                where: { id: firstPlaceId },
                data: { foreverElo: { increment: Math.floor(prizePool * first) } },
              });
              if (secondPlaceId) {
                await prisma.user.update({
                  where: { id: secondPlaceId },
                  data: { foreverElo: { increment: Math.floor(prizePool * second) } },
                });
              }
            } else {
              // For doubles:
              // 1. Give each player their individual reward (half of placement prize each)
              // 2. Give team the total of both players' rewards
              const firstPlacePrize = Math.floor(prizePool * first);
              const secondPlacePrize = Math.floor(prizePool * second);
              // Use Math.ceil for one player, Math.floor for other to avoid losing ELO from odd division
              const firstPerPlayer = Math.ceil(firstPlacePrize / 2);
              const secondPerPlayer = Math.floor(firstPlacePrize / 2);
              const secondPlaceFirst = Math.ceil(secondPlacePrize / 2);
              const secondPlaceSecond = Math.floor(secondPlacePrize / 2);

              // Get winning team and players
              const firstTeam = await prisma.team.findUnique({
                where: { id: firstPlaceId },
                include: { player1: true, player2: true }
              });
              if (firstTeam) {
                // Give each player their individual reward (ceil for one, floor for other)
                await prisma.user.update({
                  where: { id: firstTeam.player1Id },
                  data: { doublesForeverElo: { increment: firstPerPlayer } },
                });
                if (firstTeam.player2Id) {
                  await prisma.user.update({
                    where: { id: firstTeam.player2Id },
                    data: { doublesForeverElo: { increment: secondPerPlayer } },
                  });
                }
                // Give team the total
                await prisma.team.update({
                  where: { id: firstPlaceId },
                  data: { foreverElo: { increment: firstPlacePrize } },
                });
              }

              // Same for second place
              if (secondPlaceId) {
                const secondTeam = await prisma.team.findUnique({
                  where: { id: secondPlaceId },
                  include: { player1: true, player2: true }
                });
                if (secondTeam) {
                  await prisma.user.update({
                    where: { id: secondTeam.player1Id },
                    data: { doublesForeverElo: { increment: secondPlaceFirst } },
                  });
                  if (secondTeam.player2Id) {
                    await prisma.user.update({
                      where: { id: secondTeam.player2Id },
                      data: { doublesForeverElo: { increment: secondPlaceSecond } },
                    });
                  }
                  await prisma.team.update({
                    where: { id: secondPlaceId },
                    data: { foreverElo: { increment: secondPlacePrize } },
                  });
                }
              }
            }
            
            // Find and distribute to 3rd/4th (losers of semi-finals)
            const semiFinalRound = maxRound - 1;
            const semiFinalBrackets = tournament.brackets.filter(
              b => b.round === semiFinalRound && (!b.bracketType || b.bracketType === 'winner') && b.matchId
            );
            
            for (const semiBracket of semiFinalBrackets) {
              const semiMatch = await prisma.match.findUnique({
                where: { id: semiBracket.matchId! },
              });
              if (semiMatch) {
                const thirdPlaceId = semiMatch.winnerId;
                if (!isDoubles) {
                  await prisma.user.update({
                    where: { id: thirdPlaceId },
                    data: { foreverElo: { increment: Math.floor(prizePool * third) } },
                  });
                } else {
                  // Doubles 3rd place: players + team
                  const thirdPlacePrize = Math.floor(prizePool * third);
                  // Use ceil for one player, floor for other to avoid losing ELO
                  const perPlayer1 = Math.ceil(thirdPlacePrize / 2);
                  const perPlayer2 = Math.floor(thirdPlacePrize / 2);
                  const thirdTeam = await prisma.team.findUnique({
                    where: { id: thirdPlaceId },
                    include: { player1: true, player2: true }
                  });
                  if (thirdTeam) {
                    await prisma.user.update({
                      where: { id: thirdTeam.player1Id },
                      data: { doublesForeverElo: { increment: perPlayer1 } },
                    });
                    if (thirdTeam.player2Id) {
                      await prisma.user.update({
                        where: { id: thirdTeam.player2Id },
                        data: { doublesForeverElo: { increment: perPlayer2 } },
                      });
                    }
                    await prisma.team.update({
                      where: { id: thirdPlaceId },
                      data: { foreverElo: { increment: thirdPlacePrize } },
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    // Auto-complete challenges
    await handleTournamentMatchAutoComplete(isDoubles, winnerId, loser.id, player1Id, player2Id, match.id);

    // Log activity for tournament match (non-blocking)
    prisma.activity.create({
      data: {
        type: 'TOURNAMENT_MATCH',
        message: `Tournament match completed`,
        metadata: { 
          matchId: match.id, 
          tournamentId: tournamentId,
          winnerId,
          loserId: loser.id,
          isDoubles 
        },
        userId: player1Id,
        matchId: match.id,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      match,
      eloChanges: {
        winner: { id: winnerId, newElo: winner.foreverElo + winnerChange, change: winnerChange },
        loser: { id: loser.id, newElo: loser.foreverElo + loserChange, change: loserChange },
      },
      isDoubles,
    });
  } catch (error) {
    console.error("Error logging match:", error);
    return NextResponse.json(
      { error: "Failed to log match" },
      { status: 500 }
    );
  }
}

// Add auto-complete after try block (for non-error path)
async function handleTournamentMatchAutoComplete(
  isDoubles: boolean,
  winnerId: string,
  loserId: string,
  player1Id: string,
  player2Id: string,
  matchId: string
) {
  try {
    if (isDoubles) {
      // For doubles, get player IDs from teams
      const winnerTeam = await prisma.team.findUnique({ 
        where: { id: winnerId },
        select: { player1Id: true, player2Id: true }
      });
      const loserTeam = await prisma.team.findUnique({ 
        where: { id: loserId },
        select: { player1Id: true, player2Id: true }
      });
      
      if (winnerTeam && loserTeam) {
        // Check challenges between team members
        for (const wp of [winnerTeam.player1Id, winnerTeam.player2Id].filter(Boolean)) {
          for (const lp of [loserTeam.player1Id, loserTeam.player2Id].filter(Boolean)) {
            if (wp && lp) {
              await autoCompleteChallenges(wp, lp, wp, matchId, 'SINGLES');
            }
          }
        }
        await updateTeamStreaks(winnerId, loserId);
      }
    } else {
      await autoCompleteChallenges(player1Id, player2Id, winnerId, matchId, 'SINGLES');
    }
  } catch (error) {
    console.error("Error in auto-complete:", error);
  }
}
