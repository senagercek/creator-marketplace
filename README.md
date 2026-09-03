# Creator Marketplace — Paid Video Clipping Platform

A high-performance full-stack web application built for brands to launch short-form video clipping campaigns (TikTok, Instagram, YouTube) and creators to submit clips and earn based on verified views.

Built with **Next.js 15 (App Router)**, **React 19**, **TypeScript (Strict Mode)**, **tRPC v11**, **Drizzle ORM**, and **PostgreSQL**.

---

## 🌟 Key Features

### 1. Data Integrity & Financial Correctness
- **Integer Cents Modeling:** Money is represented strictly as integer cents (`total_budget`, `payout_per_1k_views`, and earnings) to prevent floating-point rounding errors.
- **Strict Budget Ceiling:** Approving a submission re-calculates the campaign's total expenditure and strictly rejects any approval that would exceed `total_budget` with a typed error (`BUDGET_EXCEEDED`).
- **Pessimistic Concurrency Control:** High-concurrency approvals are guarded with PostgreSQL `SELECT ... FOR UPDATE` row locks, guaranteeing linearizable, first-come first-served processing without budget overdrafts.
- **Auto-Completion:** When a campaign's remaining budget reaches 0, it automatically transitions its status to `completed`.

### 2. Admin & Creator Workflows
- **Dev-Only Auth Switcher:** Seamlessly switch between Admin (`usr_admin`) and Creator accounts (`usr_creator_1`, `usr_creator_2`) via HMAC-SHA256 signed session cookies.
- **Admin Dashboard:** Server-side paginated campaign list with title search and status filters (`draft`, `active`, `paused`, `completed`), campaign creation & editing, review queue with mandatory rejection reasons, and an SVG daily views timeline with zero-fill handling.
- **Creator Portal:** Browse active campaigns, submit video links validated against platform regex rules (TikTok, Instagram, YouTube), prevent duplicate URL submissions, and monitor real-time views and estimated earnings.

### 3. Automated Daily Ingestion Engine
- **`pnpm ingest`:** Simulates a daily metrics sync engine. Enforces monotonically increasing views, guarantees idempotency on repeated runs for the same day, and isolates errors so one failing submission does not abort the batch.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18+ (tested on v20 & v22)
- **pnpm**: v9+ (tested on v11)
- **Docker & Docker Compose** (for PostgreSQL)

---

### Method A: Local Development (Recommended)

1. **Clone the repository:**
   ```bash
   git clone git@github.com:senagercek/creator-marketplace.git
   cd creator-marketplace
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start PostgreSQL in Docker:**
   ```bash
   docker compose up postgres -d
   ```

4. **Setup Environment Variables:**
   ```bash
   cp .env.example .env
   ```

5. **Run Migrations & Seed Sample Data:**
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```
   *The seed script creates 1 Admin, 2 Creators, sample campaigns, submissions, and historical daily view metrics.*

6. **Start Next.js Development Server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) (or the port displayed in your terminal).

7. **Run Tests:**
   ```bash
   pnpm test
   ```

8. **Simulate Daily Ingestion:**
   ```bash
   pnpm ingest
   ```

---

### Method B: Full Docker Deployment

You can run both PostgreSQL and the Next.js standalone application inside Docker:

```bash
# Build and start all services
docker compose up -d --build

# Run migrations and seed inside the database
pnpm db:migrate
pnpm db:seed
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🧪 Test Suite

The test suite is powered by **Vitest** and covers all core requirements specified in the take-home prompt:

```bash
pnpm test
```

### Covered Test Suites:
1. **`tests/payout-math.test.ts`**: Verifies $\lfloor\text{views} / 1000\rfloor \times \text{payout\_per\_1k\_views}$, 0-view clips, and sub-1000 threshold behavior.
2. **`tests/budget-ceiling.test.ts`**: Verifies strict rejection when approval cost exceeds remaining budget, typed `BUDGET_EXCEEDED` errors, and automatic `completed` status transition.
3. **`tests/concurrency.test.ts`**: Simulates multiple simultaneous admin approvals against a limited budget using `Promise.all` to verify that `SELECT ... FOR UPDATE` serializes operations and allows only one to succeed.
4. **`tests/access-control.test.ts`**: Verifies that creators cannot access or mutate admin routes or view another creator's submissions.
5. **`tests/ingest.test.ts`**: Verifies monotonic view growth, idempotency upon re-running, and fault-tolerance against upstream API failures.

---

## 📁 Project Structure

```
creator-marketplace/
├── drizzle/                      # Committed SQL migrations (drizzle-kit)
│   └── 0000_fluffy_network.sql
├── scripts/                      # Standalone CLI utilities
│   ├── ingest.ts                 # Daily metrics ingestion (pnpm ingest)
│   ├── migrate.ts                # Migration runner
│   └── seed.ts                   # Demo data seeder
├── src/
│   ├── app/                      # Next.js 15 App Router
│   │   ├── admin/                # Admin campaign list & detail (/admin)
│   │   ├── creator/              # Creator browse & my-submissions (/creator)
│   │   └── api/trpc/[trpc]/      # tRPC HTTP batch route handler
│   ├── components/               # UI components (shadcn/ui & TailwindCSS)
│   │   ├── DailyViewsChart.tsx   # Zero-filled SVG line chart
│   │   ├── EditCampaignModal.tsx # Edit campaign modal (RHF + Zod)
│   │   └── Navbar.tsx            # Navigation & [DEV AUTH] user switcher
│   ├── server/                   # Server-side logic
│   │   ├── auth/                 # HMAC-SHA256 signed session cookies
│   │   ├── db/                   # Drizzle ORM schema & pg pool
│   │   └── trpc/                 # tRPC procedures, routers & context
│   ├── shared/                   # Shared client & server contracts
│   │   ├── types.ts              # Enums, platforms, earnings math
│   │   └── schemas/              # Shared Zod validation schemas
│   └── trpc/                     # Client-side tRPC hooks & React Query provider
├── tests/                        # Vitest automated test suites
├── Dockerfile                    # Multi-stage production Dockerfile
├── docker-compose.yml            # Container definitions for Postgres & App
├── NOTES.md                      # Take-home questions & technical design choices
└── package.json
```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts Next.js development server |
| `pnpm build` | Compiles optimized Next.js production build |
| `pnpm start` | Runs Next.js production server |
| `pnpm test` | Runs all 18 Vitest unit & integration tests |
| `pnpm ingest` | Runs the simulated daily metrics ingestion script |
| `pnpm db:generate` | Generates SQL migrations with `drizzle-kit` |
| `pnpm db:migrate` | Applies pending migrations to PostgreSQL |
| `pnpm db:seed` | Seeds database with admin, creators, campaigns & metrics |

---

## 📑 Documentation

For answers to the specific take-home questions (concurrency rationale, scope decisions, future roadmap, and AI tooling usage/corrections), see **[NOTES.md](./NOTES.md)**.
