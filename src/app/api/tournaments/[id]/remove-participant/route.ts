/**
 * Remove Participant from Tournament API
 * Only creator or admin can remove participants
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await getSessionOrUnauthorized();
    if (response) return response;

    const { id: tournamentId } = await params;
    const { participantId } = await request.json();

    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      );
    }

    // Get tournament and verify permissions
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    if (tournament.status !== 'REGISTRATION_OPEN') {
      return NextResponse.json(
        { error: "Cannot remove participants after tournament has started" },
        { status: 400 }
      );
    }

    const { session } = await getSessionOrUnauthorized();
    const userId = (session as any)?.user?.id;
    const isAdmin = (session as any)?.user?.role === 'ADMIN';
    const isCreator = tournament.creatorId === userId;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: "Only tournament creator or admin can remove participants" },
        { status: 403 }
      );
    }

    // Get the participant to refund their entry fee
    const participant = await prisma.tournamentParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // Refund entry fee if they paid
    if (participant.paidEntry) {
      if (participant.teamId) {
        // Refund to team
        await prisma.team.update({
          where: { id: participant.teamId },
          data: { foreverElo: { increment: participant.eloAtEntry } },
        });
      } else if (participant.userId) {
        // Refund to user
        await prisma.user.update({
          where: { id: participant.userId },
          data: { foreverElo: { increment: participant.eloAtEntry } },
        });
      }
    }

    // Remove participant
    await prisma.tournamentParticipant.delete({
      where: { id: participantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing participant:", error);
    return NextResponse.json(
      { error: "Failed to remove participant" },
      { status: 500 }
    );
  }
}
