import { z } from "zod";
import {
  router,
  publicProcedure,
  adminProcedure,
  creatorProcedure,
  protectedProcedure,
} from "../trpc";
import {
  submissions,
  campaigns,
  submissionMetrics,
  users,
} from "../../db/schema";
import {
  createSubmissionSchema,
  approveSubmissionSchema,
  rejectSubmissionSchema,
} from "../../../shared/schemas/submission";
import { eq, and, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { pool } from "../../db";
import { calculateEarnings, formatCentsToCurrency } from "../../../shared/types";

export const submissionRouter = router({
  // Creator submits a clip URL
  create: creatorProcedure
    .input(createSubmissionSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Verify campaign exists and is active
      const campaign = await ctx.db.query.campaigns.findFirst({
        where: eq(campaigns.id, input.campaignId),
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

      if (campaign.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Submissions are only allowed for active campaigns",
        });
      }

      // 2. Verify platform is accepted by this campaign
      if (!campaign.platforms.includes(input.platform)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This campaign does not accept submissions from ${input.platform}. Allowed: ${campaign.platforms.join(", ")}`,
        });
      }

      // 3. Duplicate URL check on the same campaign
      const existingSub = await ctx.db.query.submissions.findFirst({
        where: and(
          eq(submissions.campaignId, input.campaignId),
          eq(submissions.postUrl, input.postUrl.trim())
        ),
      });

      if (existingSub) {
        if (existingSub.status === "rejected" && existingSub.creatorId === ctx.user.id) {
          // Allow re-submitting a previously rejected clip by setting it back to pending
          const [updated] = await ctx.db
            .update(submissions)
            .set({
              status: "pending",
              rejectionReason: null,
              platform: input.platform,
              updatedAt: new Date(),
            })
            .where(eq(submissions.id, existingSub.id))
            .returning();
          return updated;
        }

        throw new TRPCError({
          code: "CONFLICT",
          message: "This clip URL has already been submitted and is currently pending review or approved.",
        });
      }

      // 4. Insert submission
      const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const [newSub] = await ctx.db
        .insert(submissions)
        .values({
          id,
          campaignId: input.campaignId,
          creatorId: ctx.user.id, // Strictly enforce ownership
          postUrl: input.postUrl.trim(),
          platform: input.platform,
          status: "pending",
        })
        .returning();

      return newSub;
    }),

  // Creator's submissions list
  mySubmissions: creatorProcedure.query(async ({ ctx }) => {
    // Strictly scoped to authenticated creator's ID
    const mySubs = await ctx.db
      .select({
        id: submissions.id,
        campaignId: submissions.campaignId,
        campaignTitle: campaigns.title,
        payoutPer1kViews: campaigns.payoutPer1kViews,
        postUrl: submissions.postUrl,
        platform: submissions.platform,
        status: submissions.status,
        rejectionReason: submissions.rejectionReason,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .innerJoin(campaigns, eq(submissions.campaignId, campaigns.id))
      .where(eq(submissions.creatorId, ctx.user.id))
      .orderBy(desc(submissions.createdAt));

    // Fetch latest metric for each submission
    const result = [];
    for (const sub of mySubs) {
      const [latestMetric] = await ctx.db
        .select({
          views: submissionMetrics.views,
          likes: submissionMetrics.likes,
          comments: submissionMetrics.comments,
          capturedAt: submissionMetrics.capturedAt,
        })
        .from(submissionMetrics)
        .where(eq(submissionMetrics.submissionId, sub.id))
        .orderBy(desc(submissionMetrics.capturedAt))
        .limit(1);

      const views = latestMetric?.views ?? 0;
      const estimatedEarnings =
        sub.status === "approved" || sub.status === "paid"
          ? calculateEarnings(views, sub.payoutPer1kViews)
          : 0;

      result.push({
        ...sub,
        currentViews: views,
        likes: latestMetric?.likes ?? 0,
        comments: latestMetric?.comments ?? 0,
        estimatedEarnings,
      });
    }

    return result;
  }),

  // Admin lists submissions for a campaign review queue
  listByCampaign: adminProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      const subs = await ctx.db
        .select({
          id: submissions.id,
          campaignId: submissions.campaignId,
          creatorId: submissions.creatorId,
          creatorName: users.name,
          creatorEmail: users.email,
          postUrl: submissions.postUrl,
          platform: submissions.platform,
          status: submissions.status,
          rejectionReason: submissions.rejectionReason,
          createdAt: submissions.createdAt,
          updatedAt: submissions.updatedAt,
        })
        .from(submissions)
        .innerJoin(users, eq(submissions.creatorId, users.id))
        .where(eq(submissions.campaignId, input.campaignId))
        .orderBy(desc(submissions.createdAt));

      const campaign = await ctx.db.query.campaigns.findFirst({
        where: eq(campaigns.id, input.campaignId),
      });

      const payoutRate = campaign?.payoutPer1kViews ?? 0;

      const result = [];
      for (const sub of subs) {
        const [latestMetric] = await ctx.db
          .select({
            views: submissionMetrics.views,
            capturedAt: submissionMetrics.capturedAt,
          })
          .from(submissionMetrics)
          .where(eq(submissionMetrics.submissionId, sub.id))
          .orderBy(desc(submissionMetrics.capturedAt))
          .limit(1);

        const views = latestMetric?.views ?? 0;
        const potentialCost = calculateEarnings(views, payoutRate);

        result.push({
          ...sub,
          currentViews: views,
          potentialCost,
        });
      }

      return result;
    }),

  // Admin approves a submission with PostgreSQL pessimistic lock & budget ceiling verification
  approve: adminProcedure
    .input(approveSubmissionSchema)
    .mutation(async ({ input }) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // 1. Fetch submission and lock it
        const subRes = await client.query(
          "SELECT * FROM submissions WHERE id = $1 FOR UPDATE",
          [input.submissionId]
        );

        const sub = subRes.rows[0];
        if (!sub) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Submission not found",
          });
        }

        if (sub.status === "approved") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Submission is already approved",
          });
        }

        // 2. Lock the parent campaign row exclusively (prevents race condition across concurrent approvals)
        const campaignRes = await client.query(
          "SELECT * FROM campaigns WHERE id = $1 FOR UPDATE",
          [sub.campaign_id]
        );

        const campaign = campaignRes.rows[0];
        if (!campaign) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign not found",
          });
        }

        // 3. Find the most recent metric row for this candidate submission
        const candidateMetricRes = await client.query(
          `SELECT views FROM submission_metrics
           WHERE submission_id = $1
           ORDER BY captured_at DESC
           LIMIT 1`,
          [sub.id]
        );
        const candidateViews = Number(candidateMetricRes.rows[0]?.views ?? 0);
        const payoutPer1k = Number(campaign.payout_per_1k_views);
        const candidateCost = Math.floor(candidateViews / 1000) * payoutPer1k;

        // 4. Calculate total spent budget of all already-approved submissions for this campaign
        const approvedSubsRes = await client.query(
          `SELECT s.id, COALESCE((
             SELECT m.views FROM submission_metrics m
             WHERE m.submission_id = s.id
             ORDER BY m.captured_at DESC
             LIMIT 1
           ), 0) AS views
           FROM submissions s
           WHERE s.campaign_id = $1 AND s.status = 'approved'`,
          [campaign.id]
        );

        let currentBudgetSpent = 0;
        for (const row of approvedSubsRes.rows) {
          const v = Number(row.views || 0);
          currentBudgetSpent += Math.floor(v / 1000) * payoutPer1k;
        }

        const totalBudget = Number(campaign.total_budget);
        const remainingBudget = totalBudget - currentBudgetSpent;

        // 5. Check budget ceiling
        if (candidateCost > remainingBudget) {
          await client.query("ROLLBACK");
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `BUDGET_EXCEEDED: Approving this submission requires ${formatCentsToCurrency(candidateCost)} (${candidateCost} cents), but only ${formatCentsToCurrency(remainingBudget)} (${remainingBudget} cents) remains in the campaign budget.`,
            cause: {
              code: "BUDGET_EXCEEDED",
              requiredCents: candidateCost,
              remainingCents: remainingBudget,
              totalBudgetCents: totalBudget,
            },
          });
        }

        // 6. Update submission status to approved
        await client.query(
          `UPDATE submissions
           SET status = 'approved', rejection_reason = NULL, updated_at = NOW()
           WHERE id = $1`,
          [sub.id]
        );

        // 7. Auto-complete campaign if remaining budget reaches zero
        const newBudgetSpent = currentBudgetSpent + candidateCost;
        let newCampaignStatus = campaign.status;
        if (newBudgetSpent >= totalBudget) {
          newCampaignStatus = "completed";
          await client.query(
            `UPDATE campaigns SET status = 'completed', updated_at = NOW() WHERE id = $1`,
            [campaign.id]
          );
        }

        await client.query("COMMIT");

        return {
          success: true,
          submissionId: sub.id,
          cost: candidateCost,
          currentBudgetSpent: newBudgetSpent,
          remainingBudget: totalBudget - newBudgetSpent,
          campaignStatus: newCampaignStatus,
        };
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    }),

  // Admin rejects a submission with a mandatory reason
  reject: adminProcedure
    .input(rejectSubmissionSchema)
    .mutation(async ({ ctx, input }) => {
      const sub = await ctx.db.query.submissions.findFirst({
        where: eq(submissions.id, input.submissionId),
      });

      if (!sub) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Submission not found",
        });
      }

      const [updated] = await ctx.db
        .update(submissions)
        .set({
          status: "rejected",
          rejectionReason: input.rejectionReason,
          updatedAt: new Date(),
        })
        .where(eq(submissions.id, input.submissionId))
        .returning();

      return updated;
    }),
});
