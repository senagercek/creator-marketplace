import {
  pgTable,
  text,
  integer,
  timestamp,
  date,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["admin", "creator"]);
export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "active",
  "paused",
  "completed",
]);
export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
  "paid",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("creator"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  platforms: text("platforms").array().notNull(), // e.g. ['tiktok', 'instagram', 'youtube']
  payoutPer1kViews: integer("payout_per_1k_views").notNull(), // In integer cents (e.g. 500 = $5.00)
  totalBudget: integer("total_budget").notNull(), // In integer cents (e.g. 100000 = $1,000.00)
  status: campaignStatusEnum("status").notNull().default("draft"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const submissions = pgTable(
  "submissions",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postUrl: text("post_url").notNull(),
    platform: text("platform").notNull(),
    status: submissionStatusEnum("status").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // The same URL cannot end up on the same campaign twice
    uniqueIndex("submission_campaign_url_idx").on(
      table.campaignId,
      table.postUrl
    ),
  ]
);

export const submissionMetrics = pgTable(
  "submission_metrics",
  {
    id: text("id").primaryKey(),
    submissionId: text("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    capturedAt: date("captured_at").notNull(), // YYYY-MM-DD
    views: integer("views").notNull().default(0),
    likes: integer("likes").notNull().default(0),
    comments: integer("comments").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Exactly one row per submission per day
    uniqueIndex("metric_submission_date_idx").on(
      table.submissionId,
      table.capturedAt
    ),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  submissions: many(submissions),
}));

export const campaignsRelations = relations(campaigns, ({ many }) => ({
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [submissions.campaignId],
    references: [campaigns.id],
  }),
  creator: one(users, {
    fields: [submissions.creatorId],
    references: [users.id],
  }),
  metrics: many(submissionMetrics),
}));

export const submissionMetricsRelations = relations(
  submissionMetrics,
  ({ one }) => ({
    submission: one(submissions, {
      fields: [submissionMetrics.submissionId],
      references: [submissions.id],
    }),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type SubmissionMetric = typeof submissionMetrics.$inferSelect;
export type NewSubmissionMetric = typeof submissionMetrics.$inferInsert;
