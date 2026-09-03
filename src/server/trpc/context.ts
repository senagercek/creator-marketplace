import { db } from "../db";
import { users, type User } from "../db/schema";
import { eq } from "drizzle-orm";
import { verifySignedUserId, SESSION_COOKIE_NAME } from "../auth/session";

export interface CreateContextOptions {
  headers: Headers;
  user?: User | null;
}

export async function createTRPCContext(opts: { headers: Headers }) {
  const cookieHeader = opts.headers.get("cookie") || "";
  let currentUser: User | null = null;

  // Extract session cookie
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (match) {
    const rawValue = decodeURIComponent(match.substring(SESSION_COOKIE_NAME.length + 1));
    const verifiedUserId = verifySignedUserId(rawValue);

    if (verifiedUserId) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, verifiedUserId),
      });
      if (user) {
        currentUser = user;
      }
    }
  }

  return {
    db,
    user: currentUser,
    headers: opts.headers,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
