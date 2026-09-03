import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16 Proxy Convention (replaces deprecated middleware.ts)
 * Operates at the network boundary for request interception, header enrichment, and route guards.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Session cookie validation / pass-through
  const sessionCookie = request.cookies.get("cm_user_session");

  // Add proxy audit header
  response.headers.set("x-next16-proxy", "active");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all application page routes:
     * Excludes /api, /_next/static, /_next/image, favicon.ico
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
