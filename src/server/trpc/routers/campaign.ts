import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../trpc";
import {
  campaigns,
  submissions,
  submissionMetrics,
} from "../../db/schema";
import {
  campaignFormSchema,
  updateCampaignSchema,
  campaignFilterSchema,
} from "../../../shared/schemas/campaign";
import { eq, ilike, and, sql, desc, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const campaignRouter = router({
  list: publicProcedure
    .input(campaignFilterSchema)
    .query(async ({ ctx, input }) => {
      const { page = 1, pageSize = 10, search, status } = input;
      const offset = (page - 1) * pageSize;

      const conditions = [];

      if (search && search.trim() !== "") {
        conditions.push(ilike(campaigns.title, `%${search.trim()}%`));
      }

      if (status) {
        conditions.push(eq(campaigns.status, status));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [totalCountResult] = await ctx.db
        .select({ count: count() })
        .from(campaigns)
        .where(whereClause);

      const items = await ctx.db
        .select()
        .from(campaigns)
        .where(whereClause)
        .orderBy(desc(campaigns.createdAt))
        .limit(pageSize)
        .offset(offset);

      const total = Number(totalCountResult?.count || 0);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  listActiveForCreators: publicProcedure
    .input(
      z
        .object({
          status: z.enum(["all", "active", "completed", "paused", "draft"]).optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const status = input?.status || "all";
      const search = input?.search?.trim();

      const conditions = [];

      if (process.env.NODE_ENV !== "test") {
        conditions.push(sql`${campaigns.id} NOT LIKE 'test_cmp_%'`);
      }

      if (status && status !== "all") {
        conditions.push(eq(campaigns.status, status));
      }

      if (search && search !== "") {
        conditions.push(ilike(campaigns.title, `%${search}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      return await ctx.db
        .select()
        .from(campaigns)
        .where(whereClause)
        .orderBy(desc(campaigns.createdAt));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.query.campaigns.findFirst({
        where: eq(campaigns.id, input.id),
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

      // Fetch all approved submissions for this campaign to compute budgetSpent and totalApprovedViews
      const approvedSubs = await ctx.db
        .select({
          id: submissions.id,
          postUrl: submissions.postUrl,
          platform: submissions.platform,
        })
        .from(submissions)
        .where(
          and(
            eq(submissions.campaignId, campaign.id),
            eq(submissions.status, "approved")
          )
        );

      let totalApprovedViews = 0;
      let budgetSpent = 0;

      for (const sub of approvedSubs) {
        const [latestMetric] = await ctx.db
          .select({ views: submissionMetrics.views })
          .from(submissionMetrics)
          .where(eq(submissionMetrics.submissionId, sub.id))
          .orderBy(desc(submissionMetrics.capturedAt))
          .limit(1);

        const views = latestMetric?.views || 0;
        totalApprovedViews += views;
        const subEarnings =
          Math.floor(views / 1000) * campaign.payoutPer1kViews;
        budgetSpent += subEarnings;
      }

      const budgetLeft = Math.max(0, campaign.totalBudget - budgetSpent);

      // Construct daily views chart across the campaign period (startsAt -> endsAt or today)
      // "The period will contain days with no metrics."
      const startDate = new Date(campaign.startsAt);
      const endDate = new Date(campaign.endsAt);
      const now = new Date();
      // Chart spans from startsAt to whichever is later: today or endsAt, but let's cap at endsAt
      const chartEnd = endDate < now ? endDate : now;

      // Query all metrics belonging to approved submissions for this campaign grouped by date
      const metricsGroupedByDate = await ctx.db
        .select({
          capturedAt: submissionMetrics.capturedAt,
          totalViewsOnDate: sql<number>`SUM(${submissionMetrics.views})::int`,
        })
        .from(submissionMetrics)
        .innerJoin(
          submissions,
          eq(submissionMetrics.submissionId, submissions.id)
        )
        .where(
          and(
            eq(submissions.campaignId, campaign.id),
            eq(submissions.status, "approved")
          )
        )
        .groupBy(submissionMetrics.capturedAt);

      const metricMap = new Map<string, number>();
      for (const row of metricsGroupedByDate) {
        const dateStr =
          typeof row.capturedAt === "string"
            ? row.capturedAt
            : new Date(row.capturedAt).toISOString().split("T")[0];
        metricMap.set(dateStr, Number(row.totalViewsOnDate || 0));
      }

      const dailyViews: Array<{ date: string; views: number }> = [];
      const curr = new Date(startDate);
      // Clamp to midnight UTC
      curr.setUTCHours(0, 0, 0, 0);
      const targetEnd = new Date(chartEnd);
      targetEnd.setUTCHours(0, 0, 0, 0);

      // If campaign start is in the future, just show startsAt
      if (curr > targetEnd) {
        dailyViews.push({
          date: curr.toISOString().split("T")[0],
          views: 0,
        });
      } else {
        while (curr <= targetEnd) {
          const dStr = curr.toISOString().split("T")[0];
          dailyViews.push({
            date: dStr,
            views: metricMap.get(dStr) ?? 0,
          });
          curr.setUTCDate(curr.getUTCDate() + 1);
        }
      }

      return {
        campaign,
        stats: {
          totalApprovedViews,
          budgetSpent,
          budgetLeft,
          dailyViews,
        },
      };
    }),

  create: adminProcedure
    .input(campaignFormSchema)
    .mutation(async ({ ctx, input }) => {
      const id = `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const [newCampaign] = await ctx.db
        .insert(campaigns)
        .values({
          id,
          title: input.title,
          platforms: input.platforms,
          payoutPer1kViews: input.payoutPer1kViews,
          totalBudget: input.totalBudget,
          status: input.status,
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
        })
        .returning();

      return newCampaign;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateCampaignSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;
      const updateValues: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data.title) updateValues.title = data.title;
      if (data.platforms) updateValues.platforms = data.platforms;
      if (data.payoutPer1kViews !== undefined)
        updateValues.payoutPer1kViews = data.payoutPer1kViews;
      if (data.totalBudget !== undefined)
        updateValues.totalBudget = data.totalBudget;
      if (data.status) updateValues.status = data.status;
      if (data.startsAt) updateValues.startsAt = new Date(data.startsAt);
      if (data.endsAt) updateValues.endsAt = new Date(data.endsAt);

      const [updated] = await ctx.db
        .update(campaigns)
        .set(updateValues)
        .where(eq(campaigns.id, id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

      return updated;
    }),
});
