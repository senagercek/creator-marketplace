import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../src/server/db";
import { campaigns, submissions, submissionMetrics, users } from "../src/server/db/schema";
import { runIngest } from "../scripts/ingest";
import { mockAdmin, mockCreator1 } from "./helpers";
import { eq, and, inArray } from "drizzle-orm";

describe("Daily Metrics Ingestion (pnpm ingest)", () => {
  // Use unique test dates to prevent collision across test runs
  const runId = Math.floor(Math.random() * 800 + 100);
  const testDate = `2029-05-${(runId % 28 + 1).toString().padStart(2, "0")}`;
  const failureDate = `2029-06-${(runId % 28 + 1).toString().padStart(2, "0")}`;

  const campaignId = `test_cmp_ingest_${Date.now()}`;
  const sub1Id = `test_sub_ingest_1_${Date.now()}`;
  const sub2Id = `test_sub_ingest_2_${Date.now()}`;

  beforeAll(async () => {
    await db.insert(users).values([mockAdmin, mockCreator1]).onConflictDoNothing();

    await db.insert(campaigns).values({
      id: campaignId,
      title: "Ingestion Test Campaign",
      platforms: ["tiktok"],
      payoutPer1kViews: 500,
      totalBudget: 50000,
      status: "active",
      startsAt: new Date(Date.now() - 86400000),
      endsAt: new Date(Date.now() + 86400000),
    });

    await db.insert(submissions).values([
      {
        id: sub1Id,
        campaignId,
        creatorId: mockCreator1.id,
        postUrl: `https://www.tiktok.com/@creator/video/ingest_${Date.now()}_1`,
        platform: "tiktok",
        status: "approved",
      },
      {
        id: sub2Id,
        campaignId,
        creatorId: mockCreator1.id,
        postUrl: `https://www.tiktok.com/@creator/video/ingest_${Date.now()}_2`,
        platform: "tiktok",
        status: "approved",
      },
    ]);

    // Initial baseline metric before test date
    await db.insert(submissionMetrics).values([
      {
        id: `met_base_${sub1Id}`,
        submissionId: sub1Id,
        capturedAt: "2029-01-01",
        views: 1000,
      },
      {
        id: `met_base_${sub2Id}`,
        submissionId: sub2Id,
        capturedAt: "2029-01-01",
        views: 2000,
      },
    ]);
  });

  it("first ingest run syncs new metrics with views strictly increasing", async () => {
    const result = await runIngest({ dateOverride: testDate });

    // Both test submissions should be inserted
    expect(result.insertedCount).toBeGreaterThanOrEqual(2);

    const m1 = await db.query.submissionMetrics.findFirst({
      where: and(
        eq(submissionMetrics.submissionId, sub1Id),
        eq(submissionMetrics.capturedAt, testDate)
      ),
    });

    expect(m1).toBeDefined();
    // Views only ever go up: baseline was 1000
    expect(m1!.views).toBeGreaterThan(1000);
  });

  it("repeated ingest run for the same day leaves data unchanged (idempotent)", async () => {
    const m1Before = await db.query.submissionMetrics.findFirst({
      where: and(
        eq(submissionMetrics.submissionId, sub1Id),
        eq(submissionMetrics.capturedAt, testDate)
      ),
    });

    // Run ingest a second time for the exact same date
    const secondRun = await runIngest({ dateOverride: testDate });

    // In the second run, everything that was synced should now be skipped
    expect(secondRun.skippedCount).toBeGreaterThanOrEqual(2);
    expect(secondRun.insertedCount).toBe(0);

    const m1After = await db.query.submissionMetrics.findFirst({
      where: and(
        eq(submissionMetrics.submissionId, sub1Id),
        eq(submissionMetrics.capturedAt, testDate)
      ),
    });

    // Verify row and view count remain identical
    expect(m1After?.views).toBe(m1Before?.views);
    expect(m1After?.id).toBe(m1Before?.id);
  });

  it("fault tolerance: if one submission blows up mid-run, the rest still finish and failure gets reported", async () => {
    const runWithFault = await runIngest({
      dateOverride: failureDate,
      forceFailureForSubmissionId: sub1Id, // Force sub1 to throw
    });

    // Verify sub1 failure is reported
    expect(runWithFault.failures.some((f) => f.submissionId === sub1Id)).toBe(true);

    // Verify sub2 still successfully finished despite sub1 throwing!
    const m2 = await db.query.submissionMetrics.findFirst({
      where: and(
        eq(submissionMetrics.submissionId, sub2Id),
        eq(submissionMetrics.capturedAt, failureDate)
      ),
    });
    expect(m2).toBeDefined();
    expect(m2!.views).toBeGreaterThan(2000);
  });

  afterAll(async () => {
    await db
      .delete(submissionMetrics)
      .where(inArray(submissionMetrics.capturedAt, [testDate, failureDate]));
    await db.delete(campaigns).where(eq(campaigns.id, campaignId));
  });
});
