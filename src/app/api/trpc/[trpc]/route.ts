import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc/root";
import { createTRPCContext } from "@/server/trpc/context";
import { SESSION_COOKIE_NAME } from "@/server/auth/session";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
    responseMeta(opts) {
      // Check if auth.switchUser was called successfully and set session cookie
      const isSwitchUser = opts.paths?.some((p) => p.includes("auth.switchUser"));
      if (isSwitchUser && Array.isArray(opts.data)) {
        const result = opts.data[0] as { token?: string } | undefined;
        if (result?.token) {
          const cookieVal = encodeURIComponent(result.token);
          return {
            headers: {
              "Set-Cookie": `${SESSION_COOKIE_NAME}=${cookieVal}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
            },
          };
        }
      }
      return {};
    },
    onError({ error, path }) {
      if (process.env.NODE_ENV === "development") {
        console.error(`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`);
      }
    },
  });

export { handler as GET, handler as POST };
