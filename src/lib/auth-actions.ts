/**
 * Authentication helper functions for server-side operations
 */
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

/**
 * Gets the current session, returning 401 if not authenticated
 */
export async function getSessionOrUnauthorized() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { session: null, response: NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )};
  }
  
  return { session, response: null };
}

/**
 * Gets the current session, returning 403 if not an admin
 */
export async function getAdminSessionOrForbidden() {
  const { session, response } = await getSessionOrUnauthorized();
  
  if (response) return { session: null, response };
  
  if (session!.user.role !== "ADMIN") {
    return { session, response: NextResponse.json(
      { error: "Forbidden - Admin access required" },
      { status: 403 }
    )};
  }
  
  return { session, response: null };
}

/**
 * Gets the current user ID, throwing if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { session } = await getSessionOrUnauthorized();
  return session?.user?.id ?? null;
}
