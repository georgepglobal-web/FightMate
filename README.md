# FightMate 🥊

A gamified MMA training tracker that turns your martial arts journey into visible progress and friendly competition. Built for casual and amateur fighters who want to stay consistent and motivated.

## Features

- **Log training sessions** — Boxing, Muay Thai, BJJ, Wrestling, MMA, S&C, and more
- **Points & leveling** — Earn points based on class level and weekly diversity; level up from Novice → Intermediate → Seasoned → Elite
- **Fighter avatar** — Visual avatar that evolves as you progress
- **Group leaderboard** — Rankings and badges (Most Balanced, Best Striker, Best Grappler, Best Wrestler)
- **Sparring sessions** — Create and accept sparring requests
- **Shoutbox** — Group chat / activity feed
- **Dual auth** — Username-only (local) or email/password (Supabase)

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- SQLite (better-sqlite3) or Supabase backend — swappable via env var
- Vitest + React Testing Library + Cypress

## Getting Started

```bash
cd mma-tracker
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Create `mma-tracker/.env.local`:

```env
# "local" for localStorage, "sqlite" for SQLite, "supabase" for Supabase
NEXT_PUBLIC_DATA_PROVIDER=sqlite

# Only needed for supabase provider
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Project Structure

```
mma-tracker/
├── app/
│   ├── components/      # All UI components
│   ├── contexts/        # AppContext (shared state)
│   ├── api/             # API routes (shoutbox)
│   ├── log/             # Log session page
│   ├── history/         # Session history page
│   ├── avatar/          # Avatar evolution page
│   ├── ranking/         # Leaderboard page
│   ├── profile/         # User profile page
│   ├── sparring/        # Sparring requests page
│   └── page.tsx         # Dashboard
├── lib/
│   ├── data-provider.ts # DataProvider interface
│   ├── local-provider.ts    # localStorage backend
│   ├── sqlite-provider.ts   # SQLite backend
│   ├── supabase-provider.ts # Supabase backend
│   ├── data.ts          # Provider factory
│   ├── constants.ts     # Types, thresholds, helpers
│   ├── points.ts        # Point calculation + diversity bonus
│   └── badges.ts        # Badge evaluation
├── cypress/e2e/         # E2E tests
└── supabase/migrations/ # DB migrations (Supabase mode)
```

## Points System

| Class Level | Multiplier |
|---|---|
| Basic | 1.0 |
| Intermediate | 1.5 |
| Advanced | 2.0 |
| All Level | 1.3 |

Weekly diversity bonus: +0.5 per unique session type in the same week (max +1.5).

## Scripts

```bash
npm run dev       # Dev server
npm run build     # Production build
npm run test      # Vitest (unit + component)
npm run test:ci   # Vitest single run
npm run e2e       # Cypress headless
npm run e2e:open  # Cypress interactive
```

## Deployment

Deployed on Vercel. Standard Next.js build — no special configuration needed.
