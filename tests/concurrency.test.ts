import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../src/server/db";
import { campaigns, submissions, submissionMetrics, users } from "../src/server/db/schema";
import { createCallerForUser, mockAdmin, mockCreator1 } from "./helpers";
import { eq } from "drizzle-orm";

describe("Concurrent Approvals & Race Condition Protection", () => {
  const adminCaller1 = createCallerForUser(mockAdmin);
  const adminCaller2 = createCallerForUser(mockAdmin);

  const campaignId = `test_cmp_concurrency_${Date.now()}`;
  const subAId = `test_sub_conc_A_${Date.now()}`;
  const subBId = `test_sub_conc_B_${Date.now()}`;

  beforeAll(async () => {
    await db.insert(users).values([mockAdmin, mockCreator1]).onConflictDoNothing();

    // Campaign has $50.00 total budget (5,000 cents), $10.00 (1,000 cents) per 1k views
    await db.insert(campaigns).values({
      id: campaignId,
      title: "Concurrent Approvals Race Condition Test",
      platforms: ["tiktok", "instagram"],
      payoutPer1kViews: 1000,
      totalBudget: 5000,
      status: "active",
      startsAt: new Date(Date.now() - 3600000),
      endsAt: new Date(Date.now() + 86400000),
    });

    // Sub A: 4,000 views -> cost $40 (4,000 cents)
    // Sub B: 4,000 views -> cost $40 (4,000 cents)
    // Alone either fits in $50 budget.
    // Together they require $80, which exceeds the $50 budget!
    await db.insert(submissions).values([
      {
        id: subAId,
        campaignId,
        creatorId: mockCreator1.id,
        postUrl: `https://www.tiktok.com/@creator/video/999111999111999111`,
        platform: "tiktok",
        status: "pending",
      },
      {
        id: subBId,
        campaignId,
        creatorId: mockCreator1.id,
        postUrl: `https://www.tiktok.com/@creator/video/999222999222999222`,
        platform: "tiktok",
        status: "pending",
      },
    ]);

    const today = new Date().toISOString().split("T")[0];
    await db.insert(submissionMetrics).values([
      {
        id: `met_${subAId}`,
        submissionId: subAId,
        capturedAt: today,
        views: 4000,
      },
      {
        id: `met_${subBId}`,
        submissionId: subBId,
        capturedAt: today,
        views: 4000,
      },
    ]);
  });

  it("ensures first-come first-served row locking: exactly one succeeds and one fails under concurrent approvals", async () => {
    // Both admin callers attempt approval simultaneously via Promise.allSettled
    const [resultA, resultB] = await Promise.allSettled([
      adminCaller1.submission.approve({ submissionId: subAId }),
      adminCaller2.submission.approve({ submissionId: subBId }),
    ]);

    const fulfilled = [resultA, resultB].filter((r) => r.status === "fulfilled");
    const rejected = [resultA, resultB].filter((r) => r.status === "rejected");

    // Concurrency requirement: "If two admins approve at the same moment against a budget that only covers one of them, only one can go through."
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // Verify rejection was specifically due to budget exceeded
    const rejectionReason = (rejected[0] as PromiseRejectedResult).reason;
    expect(rejectionReason.message).toMatch(/BUDGET_EXCEEDED/);

    // Verify database state: one is approved, one is pending
    const subA = await db.query.submissions.findFirst({
      where: eq(submissions.id, subAId),
    });
    const subB = await db.query.submissions.findFirst({
      where: eq(submissions.id, subBId),
    });

    const statuses = [subA?.status, subB?.status];
    expect(statuses).toContain("approved");
    expect(statuses).toContain("pending");

    // Verify campaign details: total spent must be $40.00, remaining must be $10.00
    const camp = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, campaignId),
    });
    expect(camp?.status).toBe("active");
  });

  afterAll(async () => {
    await db.delete(campaigns).where(eq(campaigns.id, campaignId));
  });
});
