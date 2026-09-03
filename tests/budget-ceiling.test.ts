import { describe, it, expect, beforeAll } from "vitest";
import { db } from "../src/server/db";
import { campaigns, submissions, submissionMetrics, users } from "../src/server/db/schema";
import { createCallerForUser, mockAdmin, mockCreator1 } from "./helpers";
import { eq } from "drizzle-orm";

describe("Budget Ceiling & Payout Limits", () => {
  const adminCaller = createCallerForUser(mockAdmin);
  const campaignId = `test_cmp_budget_${Date.now()}`;
  const sub1Id = `test_sub_b1_${Date.now()}`;
  const sub2Id = `test_sub_b2_${Date.now()}`;
  const sub3Id = `test_sub_b3_${Date.now()}`;

  beforeAll(async () => {
    // Ensure mock users exist in DB
    await db.insert(users).values([mockAdmin, mockCreator1]).onConflictDoNothing();

    // Create a campaign with $50.00 (5,000 cents) total budget, $10.00 (1,000 cents) per 1k views
    await db.insert(campaigns).values({
      id: campaignId,
      title: "Budget Ceiling Test Campaign",
      platforms: ["tiktok", "instagram"],
      payoutPer1kViews: 1000, // $10 per 1k views
      totalBudget: 5000, // $50.00 total budget
      status: "active",
      startsAt: new Date(Date.now() - 3600000),
      endsAt: new Date(Date.now() + 86400000),
    });

    // Create 3 submissions for this campaign:
    // Sub 1: 3,500 views -> cost = 3 * 1000 = 3,000 cents ($30) -> fits in budget ($30 <= $50)
    // Sub 2: 3,000 views -> cost = 3 * 1000 = 3,000 cents ($30) -> 30 + 30 = $60 > $50 -> EXCEEDS budget!
    // Sub 3: 2,000 views -> cost = 2 * 1000 = 2,000 cents ($20) -> 30 + 20 = $50 -> EXACTLY fills budget!
    await db.insert(submissions).values([
      {
        id: sub1Id,
        campaignId,
        creatorId: mockCreator1.id,
        postUrl: `https://www.tiktok.com/@creator/video/111111111111111111`,
        platform: "tiktok",
        status: "pending",
      },
      {
        id: sub2Id,
        campaignId,
        creatorId: mockCreator1.id,
        postUrl: `https://www.tiktok.com/@creator/video/222222222222222222`,
        platform: "tiktok",
        status: "pending",
      },
      {
        id: sub3Id,
        campaignId,
        creatorId: mockCreator1.id,
        postUrl: `https://www.tiktok.com/@creator/video/333333333333333333`,
        platform: "tiktok",
        status: "pending",
      },
    ]);

    const today = new Date().toISOString().split("T")[0];
    await db.insert(submissionMetrics).values([
      {
        id: `met_${sub1Id}`,
        submissionId: sub1Id,
        capturedAt: today,
        views: 3500,
      },
      {
        id: `met_${sub2Id}`,
        submissionId: sub2Id,
        capturedAt: today,
        views: 3000,
      },
      {
        id: `met_${sub3Id}`,
        submissionId: sub3Id,
        capturedAt: today,
        views: 2000,
      },
    ]);
  });

  it("successfully approves a submission that fits within total budget", async () => {
    const res = await adminCaller.submission.approve({ submissionId: sub1Id });

    expect(res.success).toBe(true);
    expect(res.cost).toBe(3000); // 3 * $10 = $30.00
    expect(res.remainingBudget).toBe(2000); // $50 - $30 = $20.00

    const updatedSub = await db.query.submissions.findFirst({
      where: eq(submissions.id, sub1Id),
    });
    expect(updatedSub?.status).toBe("approved");
  });

  it("fails with typed BUDGET_EXCEEDED error when an approval would exceed total budget", async () => {
    // Sub 2 costs $30.00 (3000 cents), but remaining budget is only $20.00 (2000 cents)
    await expect(
      adminCaller.submission.approve({ submissionId: sub2Id })
    ).rejects.toThrow(/BUDGET_EXCEEDED/);

    // Verify sub2 status remains pending
    const sub2 = await db.query.submissions.findFirst({
      where: eq(submissions.id, sub2Id),
    });
    expect(sub2?.status).toBe("pending");
  });

  it("completes the campaign automatically once remaining budget reaches zero", async () => {
    // Sub 3 costs $20.00 (2000 cents), which exactly exhausts the remaining $20.00 budget
    const res = await adminCaller.submission.approve({ submissionId: sub3Id });

    expect(res.success).toBe(true);
    expect(res.remainingBudget).toBe(0);
    expect(res.campaignStatus).toBe("completed");

    // Verify campaign in database is updated to completed
    const camp = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, campaignId),
    });
    expect(camp?.status).toBe("completed");
  });
});
