/**
 * Tournament Match Log API Route
 * Records match result and advances bracket
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";
import { TOURNAMENT_PRIZE_DISTRIBUTION, calculateEloChange, calculateDoublesEloChange } from "@/lib/elo";
import { autoCompleteChallenges, updateTeamStreaks } from "@/lib/match-helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response: authResponse } = await getSessionOrUnauthorized();
    if (authResponse) return authResponse;

    const userId = session!.user.id;

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

    // Get tournament to check match type and authorization
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

    // Check authorization: must be admin, creator, or a participant in this match
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    const isAdmin = user?.role === 'ADMIN';
    const isCreator = tournament.creatorId === userId;
    
    // Check if user is one of the players in this match (for singles)
    const isParticipant = player1Id === userId || player2Id === userId;
    
    // For doubles, check if user is on one of the teams in this match
    let isTeamParticipant = false;
    if (tournament.matchType === 'DOUBLES') {
      // Find the participants for both teams in this match
      const p1Participant = tournament.participants.find(p => p.id === player1Id);
      const p2Participant = tournament.participants.find(p => p.id === player2Id);
      
      if (p1Participant?.team) {
        isTeamParticipant = 
          p1Participant.team.player1Id === userId || 
          p1Participant.team.player2Id === userId;
      }
      if (p2Participant?.team) {
        isTeamParticipant = isTeamParticipant ||
          p2Participant.team.player1Id === userId || 
          p2Participant.team.player2Id === userId;
      }
    }

    if (!isAdmin && !isCreator && !isParticipant && !isTeamParticipant) {
      return NextResponse.json(
        { error: "Only admins, tournament creators, or match participants can log results" },
        { status: 403 }
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

    // Calculate ELO changes
    let winnerChange: number;
    let loserChange: number;
    let individualChanges = { team1Player1: 0, team1Player2: 0, team2Player1: 0, team2Player2: 0 };
    let individualSeasonChanges = { team1Player1: 0, team1Player2: 0, team2Player1: 0, team2Player2: 0 };
    let player1SeasonChange = 0;
    let player2SeasonChange = 0;

    if (isDoubles) {
      // Get individual player ELOs for proper calculation
      const team1Data = await prisma.team.findUnique({
        where: { id: player1Id },
        include: { 
          player1: { select: { id: true, doublesForeverElo: true } },
          player2: { select: { id: true, doublesForeverElo: true } }
        }
      });
      const team2Data = await prisma.team.findUnique({
        where: { id: player2Id },
        include: { 
          player1: { select: { id: true, doublesForeverElo: true } },
          player2: { select: { id: true, doublesForeverElo: true } }
        }
      });

      if (team1Data && team2Data && team1Data.player2 && team2Data.player2) {
        // Get games played for proper K factor calculation
        const team1Player1Games = await prisma.user.findUnique({
          where: { id: team1Data.player1Id },
          select: { doublesMatchesPlayed: true }
        });
        const team1Player2Games = team1Data.player2Id 
          ? await prisma.user.findUnique({
              where: { id: team1Data.player2Id },
              select: { doublesMatchesPlayed: true }
            })
          : null;
        const team2Player1Games = await prisma.user.findUnique({
          where: { id: team2Data.player1Id },
          select: { doublesMatchesPlayed: true }
        });
        const team2Player2Games = team2Data.player2Id
          ? await prisma.user.findUnique({
              where: { id: team2Data.player2Id },
              select: { doublesMatchesPlayed: true }
            })
          : null;

        const eloResult = calculateDoublesEloChange(
          team1Data.player1.doublesForeverElo,
          team1Data.player2.doublesForeverElo,
          team2Data.player1.doublesForeverElo,
          team2Data.player2.doublesForeverElo,
          team1Player1Games?.doublesMatchesPlayed || 0,
          team1Player2Games?.doublesMatchesPlayed || 0,
          team2Player1Games?.doublesMatchesPlayed || 0,
          team2Player2Games?.doublesMatchesPlayed || 0,
          winnerId === player1Id,
          player1Score,
          player2Score,
          true // isTournament
        );

        winnerChange = eloResult.team1Change;
        loserChange = eloResult.team2Change;
        individualChanges = eloResult.individualChanges;
        individualSeasonChanges = eloResult.individualSeasonChanges;
      } else {
        // Fallback to simple calculation
        const k = 32;
        winnerChange = Math.round(k * 0.5);
        loserChange = Math.round(k * -0.5);
      }
    } else {
      // Proper ELO calculation for singles using the standard formula
      const user1 = tournament.participants.find(p => p.userId === player1Id)?.user;
      const user2 = tournament.participants.find(p => p.userId === player2Id)?.user;

      if (user1 && user2) {
        // Get games played for proper K factor (both forever and season)
        const player1Games = await prisma.user.findUnique({
          where: { id: player1Id },
          select: { matchesPlayed: true }
        });
        const player2Games = await prisma.user.findUnique({
          where: { id: player2Id },
          select: { matchesPlayed: true }
        });

        const eloResult = calculateEloChange(
          user1.foreverElo,
          user2.foreverElo,
          player1Games?.matchesPlayed || 0,
          player2Games?.matchesPlayed || 0,
          { player1Score, player2Score, winnerId: winnerId === player1Id ? "player1" : "player2" },
          true // isTournament
        );

        // Assign changes based on who actually won
        if (winnerId === player1Id) {
          winnerChange = eloResult.player1Change;
          loserChange = eloResult.player2Change;
          player1SeasonChange = eloResult.player1SeasonChange;
          player2SeasonChange = eloResult.player2SeasonChange;
        } else {
          winnerChange = eloResult.player2Change;
          loserChange = eloResult.player1Change;
          player1SeasonChange = eloResult.player2SeasonChange;
          player2SeasonChange = eloResult.player1SeasonChange;
        }
      } else {
        // Fallback
        const k = 32;
        winnerChange = Math.round(k * 0.5);
        loserChange = Math.round(k * -0.5);
      }
    }

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

      // Get player IDs for individual updates
      const winnerTeam = await prisma.team.findUnique({
        where: { id: winnerId },
        include: { player1: true, player2: true }
      });
      const loserTeam = await prisma.team.findUnique({
        where: { id: loser.id },
        include: { player1: true, player2: true }
      });

      // Update individual doubles ELOs for tournament participants
      if (winnerTeam) {
        if (winnerTeam.player1) {
          await prisma.user.update({
            where: { id: winnerTeam.player1Id },
            data: {
              doublesForeverElo: { increment: individualChanges.team1Player1 },
              doublesSeasonElo: { increment: individualSeasonChanges.team1Player1 },
              doublesMatchesPlayed: { increment: 1 },
              weeklyDoublesMatches: { increment: 1 },
              weeklyDoublesEloGained: { increment: Math.max(0, individualChanges.team1Player1) },
            },
          });
        }
        if (winnerTeam.player2 && winnerTeam.player2Id) {
          await prisma.user.update({
            where: { id: winnerTeam.player2Id },
            data: {
              doublesForeverElo: { increment: individualChanges.team1Player2 },
              doublesSeasonElo: { increment: individualSeasonChanges.team1Player2 },
              doublesMatchesPlayed: { increment: 1 },
              weeklyDoublesMatches: { increment: 1 },
              weeklyDoublesEloGained: { increment: Math.max(0, individualChanges.team1Player2) },
            },
          });
        }
      }
      if (loserTeam) {
        if (loserTeam.player1) {
          await prisma.user.update({
            where: { id: loserTeam.player1Id },
            data: {
              doublesForeverElo: { increment: individualChanges.team2Player1 },
              doublesSeasonElo: { increment: individualSeasonChanges.team2Player1 },
              doublesMatchesPlayed: { increment: 1 },
              weeklyDoublesMatches: { increment: 1 },
              weeklyDoublesEloGained: { increment: Math.max(0, individualChanges.team2Player1) },
            },
          });
        }
        if (loserTeam.player2 && loserTeam.player2Id) {
          await prisma.user.update({
            where: { id: loserTeam.player2Id },
            data: {
              doublesForeverElo: { increment: individualChanges.team2Player2 },
              doublesSeasonElo: { increment: individualSeasonChanges.team2Player2 },
              doublesMatchesPlayed: { increment: 1 },
              weeklyDoublesMatches: { increment: 1 },
              weeklyDoublesEloGained: { increment: Math.max(0, individualChanges.team2Player2) },
            },
          });
        }
      }
    } else {
      // Update user ELOs with both forever and season changes
      await prisma.user.update({
        where: { id: winnerId },
        data: { 
          foreverElo: { increment: winnerChange },
          seasonElo: { increment: winnerId === player1Id ? player1SeasonChange : player2SeasonChange },
          matchesPlayed: { increment: 1 },
          weeklySinglesMatches: { increment: 1 },
          weeklySinglesEloGained: { increment: Math.max(0, winnerChange) },
        },
      });
      await prisma.user.update({
        where: { id: loser.id },
        data: { 
          foreverElo: { increment: loserChange },
          seasonElo: { increment: loser.id === player1Id ? player1SeasonChange : player2SeasonChange },
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
            const winnerId = finalMatchRecord.winnerId;
            const loserId = winnerId === finalMatchRecord.player1Id 
              ? finalMatchRecord.player2Id 
              : finalMatchRecord.player1Id;
            
            // Distribute prizes for singles
            if (!isDoubles) {
              await prisma.user.update({
                where: { id: winnerId },
                data: { foreverElo: { increment: Math.floor(prizePool * first) } },
              });
              if (loserId) {
                await prisma.user.update({
                  where: { id: loserId },
                  data: { foreverElo: { increment: Math.floor(prizePool * second) } },
                });
              }
            } else {
              // For doubles: prizes go to team ELO
              const firstPlacePrize = Math.floor(prizePool * first);
              const secondPlacePrize = Math.floor(prizePool * second);

              // Look up team IDs for the winners
              const firstPlaceParticipant = tournament.participants.find(p => p.id === winnerId);
              const secondPlaceParticipant = loserId ? tournament.participants.find(p => p.id === loserId) : null;

              // Give first place team the prize
              if (firstPlaceParticipant?.teamId) {
                await prisma.team.update({
                  where: { id: firstPlaceParticipant.teamId },
                  data: { foreverElo: { increment: firstPlacePrize } },
                });
                
                // Record team ELO history
                await prisma.teamEloHistory.create({
                  data: {
                    teamId: firstPlaceParticipant.teamId,
                    changeType: 'TOURNAMENT_PRIZE',
                    eloBefore: firstPlaceParticipant.team?.foreverElo || 0,
                    eloAfter: (firstPlaceParticipant.team?.foreverElo || 0) + firstPlacePrize,
                    change: firstPlacePrize,
                    description: `Tournament 1st place prize: ${tournament.name}`,
                    metadata: { tournamentId, placement: 1 },
                  },
                });
              }

              // Give second place team the prize
              if (secondPlaceParticipant?.teamId) {
                await prisma.team.update({
                  where: { id: secondPlaceParticipant.teamId },
                  data: { foreverElo: { increment: secondPlacePrize } },
                });
                
                await prisma.teamEloHistory.create({
                  data: {
                    teamId: secondPlaceParticipant.teamId,
                    changeType: 'TOURNAMENT_PRIZE',
                    eloBefore: secondPlaceParticipant.team?.foreverElo || 0,
                    eloAfter: (secondPlaceParticipant.team?.foreverElo || 0) + secondPlacePrize,
                    change: secondPlacePrize,
                    description: `Tournament 2nd place prize: ${tournament.name}`,
                    metadata: { tournamentId, placement: 2 },
                  },
                });
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
                const thirdPlaceParticipantId = semiMatch.winnerId;
                const thirdPlaceParticipant = tournament.participants.find(p => p.id === thirdPlaceParticipantId);
                
                if (!isDoubles && thirdPlaceParticipant?.userId) {
                  await prisma.user.update({
                    where: { id: thirdPlaceParticipant.userId },
                    data: { foreverElo: { increment: Math.floor(prizePool * third) } },
                  });
                } else if (isDoubles && thirdPlaceParticipant?.teamId) {
                  // Doubles 3rd place: prize goes to team ELO
                  const thirdPlacePrize = Math.floor(prizePool * third);
                  await prisma.team.update({
                    where: { id: thirdPlaceParticipant.teamId },
                    data: { foreverElo: { increment: thirdPlacePrize } },
                  });
                  
                  await prisma.teamEloHistory.create({
                    data: {
                      teamId: thirdPlaceParticipant.teamId,
                      changeType: 'TOURNAMENT_PRIZE',
                      eloBefore: thirdPlaceParticipant.team?.foreverElo || 0,
                      eloAfter: (thirdPlaceParticipant.team?.foreverElo || 0) + thirdPlacePrize,
                      change: thirdPlacePrize,
                      description: `Tournament 3rd place prize: ${tournament.name}`,
                      metadata: { tournamentId, placement: 3 },
                    },
                  });
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
