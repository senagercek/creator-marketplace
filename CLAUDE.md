# CLAUDE.md — Anthropic Claude Project Guide

This guide contains essential commands, architectural guidelines, and codebase conventions for Claude.

---

## 1. Primary Commands

- **Run Dev Server**: `pnpm dev`
- **Type Check & Build**: `pnpm build`
- **Run Tests**: `pnpm test` (Runs Vitest in sequential mode)
- **Run Migrations**: `pnpm db:migrate`
- **Seed Database**: `pnpm db:seed`
- **Run Metrics Ingestion**: `pnpm ingest`
- **Generate Migrations**: `pnpm db:generate`

---

## 2. Architecture & Tech Stack

- **Framework**: Next.js 15 App Router with React 19 and TypeScript in strict mode.
- **API Communication**: tRPC v11 only. All data mutations and queries must go through tRPC routers (`src/server/trpc/routers/`). No REST route handlers for data.
- **Database**: PostgreSQL 16 accessed via Drizzle ORM (`drizzle-orm/node-postgres`).
- **Validation**: Zod schemas in `src/shared/schemas/` shared between React Hook Form and tRPC procedures.
- **Styling**: TailwindCSS v4 with `@tailwindcss/postcss` and shadcn-style component primitives.
- **Authentication**: HMAC-SHA256 signed session cookie (`cm_user_session`) with dev user switcher in `Navbar.tsx`.

---

## 3. Critical Code Invariants

1. **Currency in Integer Cents:**
   - Database columns: `payout_per_1k_views` and `total_budget` are `integer`.
   - Never use floating-point numbers for currency calculations.
2. **Payout Calculation Formula:**
   - `Math.floor(views / 1000) * payoutPer1kViews` (only on approved submissions).
3. **Concurrency & Budget Ceiling:**
   - Approvals must acquire a PostgreSQL row lock: `SELECT * FROM campaigns WHERE id = $1 FOR UPDATE`.
   - If approval cost exceeds remaining budget, reject with `TRPCError(PRECONDITION_FAILED, code: 'BUDGET_EXCEEDED')`.
   - When remaining budget reaches 0, update campaign status to `'completed'`.
4. **Data Isolation:**
   - All creator procedures must use `ctx.user.id` to prevent cross-account tampering.
   - Rejection requires a mandatory reason (min 3 characters).

---

## 4. Code Style & Conventions

- Use TypeScript strict mode with explicit return types on server procedures.
- Do not introduce external charting or authentication libraries (restraint principle).
- Use `fileParallelism: false` in `vitest.config.ts` for database integration test safety.
- Write commits using standard conventional commit messages (`feat:`, `fix:`, `chore:`).
