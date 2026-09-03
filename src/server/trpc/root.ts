import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { campaignRouter } from "./routers/campaign";
import { submissionRouter } from "./routers/submission";

export const appRouter = router({
  auth: authRouter,
  campaign: campaignRouter,
  submission: submissionRouter,
});

export type AppRouter = typeof appRouter;
