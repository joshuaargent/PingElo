/**
 * Set Admin API Route
 * Sets the current user as admin (only works if no admin exists, or if correct secret provided)
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-actions";

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const { session, response } = await getSessionOrUnauthorized();
    if (response) return response;

    const userId = (session!.user as { id: string }).id;
    const adminSecret = process.env.ADMIN_SET_SECRET;
    
    // Check authorization
    const authHeader = request.headers.get("authorization");
    const hasSecret = adminSecret && authHeader === `Bearer ${adminSecret}`;
    
    // Check if there are any admins
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });

    // Allow if: no admins exist, OR correct secret provided, OR user is already admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.role === "ADMIN") {
      return NextResponse.json({
        success: true,
        message: "User is already an admin",
        user: { id: user.id, name: user.name, role: user.role },
      });
    }

    if (adminCount > 0 && !hasSecret) {
      return NextResponse.json(
        { error: "Cannot set admin without authorization. An admin already exists." },
        { status: 403 }
      );
    }

    // Update user to admin
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: "ADMIN" },
    });

    return NextResponse.json({
      success: true,
      message: "You are now an admin!",
      user: { id: updatedUser.id, name: updatedUser.name, role: updatedUser.role },
    });
  } catch (error) {
    console.error("Error setting admin:", error);
    return NextResponse.json(
      { error: "Failed to set admin" },
      { status: 500 }
    );
  }
}
