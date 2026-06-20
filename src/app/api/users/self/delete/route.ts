/**
 * Self Delete API Route
 * Allows users to delete their own account
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";
import { signOut } from "next-auth/react";

export async function DELETE() {
  try {
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;

    const userId = (session!.user as { id: string }).id;

    // Delete the user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
