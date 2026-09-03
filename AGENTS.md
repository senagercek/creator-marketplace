# AGENTS.md — Agent Guidelines & Architecture Manual

This document provides instructions, conventions, and architectural context for autonomous AI agents working in this repository.

---

## 1. Project Overview & Technology Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript (Strict Mode)
- **API & Networking**: tRPC v11 (No REST route handlers for application data)
- **Database & ORM**: PostgreSQL 16 with Drizzle ORM
- **Forms & Validation**: React Hook Form with Zod (schemas shared between client & server in `src/shared/schemas/`)
- **Styling**: TailwindCSS v4 with `@tailwindcss/postcss` and shadcn-style UI components
- **Testing**: Vitest (Unit & Integration tests against live PostgreSQL)
- **Package Manager**: `pnpm`

---

## 2. Fundamental Business Rules & Invariants

When modifying or extending this codebase, the following invariants MUST NEVER be violated:

1. **Integer Cents Representation:**
   - Currency (`total_budget`, `payout_per_1k_views`, and calculated earnings) MUST always be represented as **integer cents**.
   - NEVER use `float` or `double` types in database schemas, calculations, or tRPC inputs/outputs.

2. **Payout Mathematics:**
   - Earnings on an approved clip are strictly calculated as:
     $$\text{earnings} = \lfloor\text{views} / 1000\rfloor \times \text{payout\_per\_1k\_views}$$
   - Views under 1,000 earn 0 cents.

3. **Pessimistic Concurrency & Budget Ceiling:**
   - Approvals must ALWAYS be performed inside a database transaction with `SELECT * FROM campaigns WHERE id = $1 FOR UPDATE`.
   - The remaining budget MUST be dynamically calculated inside the locked transaction.
   - If `current_budget_spent + candidate_cost > total_budget`, abort the transaction and raise a typed `TRPCError` with code `PRECONDITION_FAILED` and cause `{ code: 'BUDGET_EXCEEDED' }`.
   - When remaining budget reaches 0, the campaign status MUST automatically update to `'completed'`.

4. **Access Control & Multi-Tenancy:**
   - Creators can NEVER access or mutate another creator's submissions.
   - All creator queries must bind to `ctx.user.id` on the server, ignoring any client-provided user IDs.
   - Admin actions (`campaign.create`, `campaign.update`, `submission.approve`, `submission.reject`, `submission.listByCampaign`) MUST be protected with `adminProcedure`.

5. **Metrics Ingestion Invariants (`pnpm ingest`):**
   - Must only process approved submissions.
   - Views must be strictly monotonically increasing.
   - Script runs MUST be idempotent for the same day (`UNIQUE(submission_id, captured_at)`).
   - Upstream API failures on one submission must NOT abort the remaining submissions in the batch.

---

## 3. Key CLI Commands

Always run commands using `pnpm`:

```bash
# Development server
pnpm dev

# Type check & Production build
pnpm build

# Run production server
pnpm start

# Run all test suites
pnpm test

# Generate Drizzle migrations
pnpm db:generate

# Execute pending migrations
pnpm db:migrate

# Seed demo data (1 admin, 2 creators, campaigns, submissions, daily metrics)
pnpm db:seed

# Run simulated daily metrics ingestion
pnpm ingest
```

---

## 4. Testing Conventions

- Tests are located in the `tests/` directory.
- `vitest.config.ts` has `fileParallelism: false` because integration tests share the PostgreSQL database. Keep test suites serial to avoid cross-test data pollution.
- All 18 tests across the 5 test suites (`payout-math`, `budget-ceiling`, `concurrency`, `access-control`, `ingest`) MUST pass before committing any changes.

---

## 5. Architectural Directory Layout

- `src/server/db/schema.ts`: Drizzle schema models (`users`, `campaigns`, `submissions`, `submission_metrics`).
- `src/server/trpc/trpc.ts`: Role-based procedure builders (`publicProcedure`, `protectedProcedure`, `adminProcedure`, `creatorProcedure`).
- `src/server/trpc/routers/`: Feature routers (`auth.ts`, `campaign.ts`, `submission.ts`).
- `src/shared/`: Shared types, platforms, regex validators, and Zod schemas.
- `src/components/`: Reusable components (Navbar, Modals, SVG DailyViewsChart).
- `scripts/`: Standalone scripts executed via `tsx` (`migrate.ts`, `seed.ts`, `ingest.ts`).
