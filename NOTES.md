# NOTES.md

## 1. Setup Steps (That Work on a Machine That Isn't Yours)

### Prerequisites
- **Node.js**: v18+ (tested on Node v20 / v22 / v26)
- **pnpm**: v9+ (tested on v11)
- **Docker & Docker Compose** (or a local PostgreSQL 15/16 instance)

### Quick Start

1. **Clone and Install Dependencies:**
   ```bash
   git clone <repo-url>
   cd creator-marketplace
   pnpm install
   ```

2. **Start Database:**
   Using Docker Compose:
   ```bash
   docker compose up -d
   ```
   *(Or point `DATABASE_URL` in `.env` to your existing PostgreSQL instance).*

3. **Configure Environment:**
   Copy the example environment file (defaults connect to `localhost:5432`):
   ```bash
   cp .env.example .env
   ```

4. **Run Migrations & Seed Sample Data:**
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```
   *The seed script populates 1 Admin (`usr_admin`) and 2 Creators (`usr_creator_1`, `usr_creator_2`), 3 sample campaigns with different statuses, and historical view metrics.*

5. **Run Tests:**
   ```bash
   pnpm test
   ```
   *All 5 required test suites will execute and pass cleanly.*

6. **Start the Development Server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser. Use the top-right **[DEV AUTH]** user switcher to toggle between Admin and Creator roles.

7. **Run Daily Metrics Ingestion:**
   ```bash
   pnpm ingest
   ```

---

## 2. How We Dealt with Concurrent Approvals (And What Was Ruled Out)

### The Core Challenge
If two admins simultaneously click "Approve" on two different submissions, and the campaign budget only has enough funds remaining to cover one of them, a naive read-then-write approach creates a race condition where both reads see sufficient remaining budget, both writes proceed, and the campaign is overspent.

### Our Solution: Pessimistic Row-Level Locking (`SELECT ... FOR UPDATE`)
We executed the entire approval within an ACID PostgreSQL transaction with explicit row-level locking on the parent campaign:

```sql
BEGIN;

-- 1. Acquire exclusive lock on the parent campaign row
SELECT * FROM campaigns WHERE id = $campaign_id FOR UPDATE;

-- 2. Fetch the candidate submission and its latest metric views
SELECT views FROM submission_metrics WHERE submission_id = $sub_id ORDER BY captured_at DESC LIMIT 1;

-- 3. Calculate all already-committed expenditures for this campaign
SELECT s.id, (SELECT m.views FROM submission_metrics m WHERE m.submission_id = s.id ORDER BY m.captured_at DESC LIMIT 1) 
FROM submissions s WHERE s.campaign_id = $campaign_id AND s.status = 'approved';

-- 4. Verify budget ceiling
IF (current_budget_spent + candidate_cost > total_budget) THEN
  ROLLBACK;
  RAISE EXCEPTION 'BUDGET_EXCEEDED';
END IF;

-- 5. Mark approved and conditionally mark campaign 'completed' if remaining budget reaches 0
UPDATE submissions SET status = 'approved' WHERE id = $sub_id;
IF (current_budget_spent + candidate_cost >= total_budget) THEN
  UPDATE campaigns SET status = 'completed' WHERE id = $campaign_id;
END IF;

COMMIT;
```

**Why this works reliably:**
When Admin A and Admin B submit approvals at the exact same millisecond:
1. Admin A acquires the exclusive row lock on `campaigns` first.
2. Admin B's transaction blocks and waits at `SELECT ... FOR UPDATE` until Admin A's transaction either commits or rolls back.
3. When Admin A commits, Admin B's query resumes. Admin B now reads the fresh, committed `budget_spent`.
4. Admin B detects `current_budget_spent + candidate_cost > total_budget`, aborts with `ROLLBACK`, and returns a strongly-typed `BUDGET_EXCEEDED` error (`TRPCError` with code `PRECONDITION_FAILED`).

### What We Tried or Ruled Out Along the Way:
1. **Application-level In-Memory Mutexes (e.g. AsyncLock):**
   - *Ruled Out*: In Next.js (serverless or multi-container production environments), different requests hit different processes/lambdas. In-memory locks only protect a single Node.js process and fail completely under horizontal scaling.
2. **Optimistic Locking (`version` column / CAS):**
   - *Ruled Out*: Optimistic locking requires retry loops (`retry on conflict`). Because calculating budget requires re-evaluating the latest view metrics and remaining cents, a rejected approval due to an exhausted budget should fail immediately with a clear error rather than needlessly retrying a doomed operation.
3. **Queue-based Processing (Redis / BullMQ):**
   - *Ruled Out*: Excessive operational complexity for a take-home. PostgreSQL's battle-tested MVCC and `SELECT ... FOR UPDATE` provide zero-dependency, bulletproof transactional guarantees natively.

---

## 3. What Was Left Out on Purpose

- **Third-Party Auth Providers (Clerk, NextAuth, Auth0):** As instructed in Section 4.1 (*"Keep this cheap. A signed cookie holding a userId plus a dev-only user switcher is enough. Don't wire up an auth provider"*), we built an HMAC-SHA256 signed session cookie with a clean Dev User Switcher in the navigation bar.
- **Custom Design Flourishes & Animations:** As emphasized in Section 7 (*"Things that won't earn you anything here: custom design work... The UI we look at for states, accessibility and restraint"*), we focused on clear loading states, accessible tables, informative empty states, and functional badge states using shadcn/ui and TailwindCSS.
- **Client-Side Heavy Charting Dependencies:** Instead of pulling in large charting libraries (e.g., Recharts, Chart.js), we built a lightweight, 0-dependency SVG line chart (`DailyViewsChart.tsx`) that properly renders dates, tooltips, and zero-fills periods with missing metrics.

---

## 4. The First Thing We'd Fix Given Another Day

1. **Pre-aggregated / Cached Expenditure on the Campaign Row:**
   - *Current Implementation:* During approval, we aggregate the latest metric for all approved submissions of that campaign.
   - *Improvement:* Maintain an `approved_budget_spent` integer column directly on the `campaigns` table. While our current query is fast and guaranteed consistent inside the transaction, an indexed aggregate column or materialized view would optimize performance for campaigns with tens of thousands of submissions.
2. **Webhook / Background Polling for Live Social APIs:**
   - In production, instead of the simulated `pnpm ingest` script, connect official TikTok Open API, Instagram Graph API, and YouTube Data API v3 scrapers with rate limiting, exponential backoff, and webhook listeners.
3. **Automated Stripe/Payout Integration:**
   - Transitioning `approved` submissions to `paid` via Stripe Connect transfers with idempotency keys.

---

## 5. Where We Used AI Tooling and What We Had to Correct

- **Where AI was used:**
  - Generating initial boilerplate configurations (Tailwind v4 PostCSS config, Vitest test suite scaffolding, and seed records).
  - Draft regex patterns for TikTok, Instagram, and YouTube short URLs.
- **What had to be corrected:**
  1. **Zod Schema Refinement & `.partial()` Collision:**
     - AI initially applied `.refine(...)` (date comparison check) directly on `campaignFormSchema` and then attempted `.partial()` on it for `updateCampaignSchema`. Because `ZodEffects` lacks `.partial()`, TypeScript threw a compile error. We corrected this by separating `baseCampaignSchema` from the refined `campaignFormSchema` and deriving `updateCampaignSchema = baseCampaignSchema.partial()`.
  2. **Vitest Multi-thread Test Cross-Talk:**
     - Vitest by default executes test files in parallel across worker threads. Because `budget-ceiling.test.ts` and `ingest.test.ts` hit the same live PostgreSQL test database concurrently, `runIngest()` picked up a newly approved submission from the budget ceiling test, inflating its view count and causing a race condition in the test assertions. We resolved this by configuring `fileParallelism: false` in `vitest.config.ts` so that integration test suites run sequentially against the database, and by using isolated dates in `ingest.test.ts`.
  3. **PostgreSQL Concurrency Handling:**
     - Generic AI completions frequently suggest simple Drizzle update queries without transaction boundaries. We explicitly replaced this with raw transaction client management (`pool.connect()`, `BEGIN`, `SELECT ... FOR UPDATE`, `COMMIT/ROLLBACK`), ensuring true linearizability for concurrent approvals.
