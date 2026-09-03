# Creator Marketplace (Paid Video Clipping Platform)

A full-stack, production-grade take-home assignment implementation built with **Next.js 15 (App Router)**, **tRPC v11**, **Drizzle ORM**, **PostgreSQL**, **TailwindCSS**, and **Vitest**.

## 🚀 Key Features

- **Pessimistic Concurrency & Budget Ceiling Protection**: Handled via PostgreSQL `BEGIN ... SELECT * FROM campaigns WHERE id = $1 FOR UPDATE` transactions. Prevents race conditions when concurrent admins approve submissions against finite budgets.
- **Strict Role & Ownership Enforcement**: tRPC middleware enforces role authorization (`adminProcedure` vs `creatorProcedure`) and guarantees creators cannot access or mutate other creators' submissions.
- **Server-Side Paginated Admin Dashboard**: Filter campaigns by status, search by title, inspect budget metrics, and visualize daily views timeline.
- **Review Queue**: Approve or reject video submissions with mandatory rejection reasons and typed budget ceiling error feedback.
- **Creator Portal**: Browse active campaigns, validate live platform URLs (TikTok, Instagram, YouTube), and track estimated earnings calculated via $\lfloor\text{views} / 1000\rfloor \times \text{payout}$.
- **Metrics Ingestion Script (`pnpm ingest`)**: Simulates daily views sync, enforces increasing view counts, guarantees idempotency on re-runs, and isolates per-submission errors.
- **Comprehensive Vitest Suite**: 18 tests covering payout math, budget ceiling enforcement, race conditions under concurrency, access control, and ingestion idempotency.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router, React 19, TypeScript strict mode)
- **API:** tRPC v11 (`@trpc/server`, `@trpc/client`, `@trpc/react-query`)
- **Database & ORM:** PostgreSQL 16 with Drizzle ORM (`drizzle-kit` migrations committed)
- **Styling & UI:** TailwindCSS, Radix/shadcn-inspired components, Lucide icons
- **Form Handling:** React Hook Form + Zod (schemas shared between client & server)
- **Testing:** Vitest

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL (Docker Compose or local Postgres)
docker compose up -d

# 3. Configure environment
cp .env.example .env

# 4. Run migrations and seed data
pnpm db:migrate
pnpm db:seed

# 5. Run test suite
pnpm test

# 6. Run metrics ingest script
pnpm ingest

# 7. Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application. Use the top-right **[DEV AUTH]** dropdown in the navigation bar to switch between Admin and Creator roles.

Detailed technical design decisions and concurrency analysis are documented in [NOTES.md](./NOTES.md).
