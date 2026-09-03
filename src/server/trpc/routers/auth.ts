import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { users } from "../../db/schema";
import { signUserId } from "../../auth/session";

export const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user ?? null;
  }),

  listDevUsers: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(users).orderBy(users.role, users.name);
  }),

  switchUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, input.userId),
      });

      if (!user) {
        throw new Error("User not found");
      }

      const signedToken = signUserId(user.id);
      return {
        success: true,
        user,
        token: signedToken,
      };
    }),
});
