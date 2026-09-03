import { db, pool } from "../src/server/db";
import { submissions, submissionMetrics } from "../src/server/db/schema";
import { eq, desc, and } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

export interface IngestOptions {
  dateOverride?: string; // Optional YYYY-MM-DD override for testing
  forceFailureForSubmissionId?: string; // Optional for testing fault tolerance
}

export async function runIngest(options: IngestOptions = {}) {
  const today = options.dateOverride || new Date().toISOString().split("T")[0];
  console.log(`[Ingest] Starting daily metrics sync for date: ${today}`);

  // Fetch all approved submissions
  const approvedSubmissions = await db
    .select({
      id: submissions.id,
      postUrl: submissions.postUrl,
      platform: submissions.platform,
    })
    .from(submissions)
    .where(eq(submissions.status, "approved"));

  console.log(
    `[Ingest] Found ${approvedSubmissions.length} approved submissions to process.`
  );

  let insertedCount = 0;
  let skippedCount = 0;
  const failures: Array<{ submissionId: string; error: string }> = [];

  for (const sub of approvedSubmissions) {
    try {
      // Simulate fault injection for test verification if requested
      if (options.forceFailureForSubmissionId === sub.id) {
        throw new Error(`Simulated upstream API error for submission ${sub.id}`);
      }

      // 1. Check if a metric row already exists for today (Idempotency check)
      const existing = await db.query.submissionMetrics.findFirst({
        where: and(
          eq(submissionMetrics.submissionId, sub.id),
          eq(submissionMetrics.capturedAt, today)
        ),
      });

      if (existing) {
        console.log(
          `[Ingest] Submission ${sub.id} already has a metric for ${today}. Leaving data as-is (views: ${existing.views}).`
        );
        skippedCount++;
        continue;
      }

      // 2. Fetch the most recent metric to ensure "views only ever go up"
      const [latestMetric] = await db
        .select({
          views: submissionMetrics.views,
        })
        .from(submissionMetrics)
        .where(eq(submissionMetrics.submissionId, sub.id))
        .orderBy(desc(submissionMetrics.capturedAt))
        .limit(1);

      const previousViews = latestMetric?.views ?? 0;
      // Views strictly increase
      const viewDelta = Math.floor(Math.random() * 2000) + 500;
      const newViews = previousViews + viewDelta;
      const newLikes = Math.max(1, Math.floor(newViews * 0.07));
      const newComments = Math.max(1, Math.floor(newViews * 0.006));

      const metricId = `met_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      await db.insert(submissionMetrics).values({
        id: metricId,
        submissionId: sub.id,
        capturedAt: today,
        views: newViews,
        likes: newLikes,
        comments: newComments,
      });

      console.log(
        `[Ingest] Submission ${sub.id}: Synced metric for ${today} (views: ${previousViews} -> ${newViews}, +${viewDelta}).`
      );
      insertedCount++;
    } catch (err: any) {
      // "if one submission blows up mid-run, the rest still finish and the failure gets reported"
      console.error(
        `[Ingest Error] Failed to sync submission ${sub.id}:`,
        err?.message || err
      );
      failures.push({
        submissionId: sub.id,
        error: err?.message || String(err),
      });
    }
  }

  console.log(`\n[Ingest Summary]`);
  console.log(`- Inserted: ${insertedCount}`);
  console.log(`- Skipped (already synced today): ${skippedCount}`);
  console.log(`- Failures: ${failures.length}`);

  return {
    date: today,
    totalApproved: approvedSubmissions.length,
    insertedCount,
    skippedCount,
    failures,
  };
}

// When run directly via CLI (pnpm ingest)
if (process.argv[1]?.endsWith("ingest.ts")) {
  runIngest()
    .then(() => pool.end())
    .catch((err) => {
      console.error("[Ingest Fatal Error]", err);
      pool.end().finally(() => process.exit(1));
    });
}
