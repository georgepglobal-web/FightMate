# FightMate — Project Overview

Next.js 16 (React 19) MMA/martial arts training tracker. Tailwind CSS 4 for styling. Supabase optional backend. Deployed on Vercel.

## Architecture

Single-page app with client-side routing via React context (no Next.js file-based routing beyond the single `app/page.tsx` entry point). All pages are rendered client-side (`"use client"` throughout).

Provider-based data abstraction with two interchangeable backends:

- `lib/local-provider.ts` — `LocalStorageProvider`, stores everything in browser localStorage
- `lib/supabase-provider.ts` — `SupabaseProvider`, wraps `LocalStorageProvider` as a cache and fire-and-forgets writes to Supabase
- `lib/data-provider.ts` — `DataProvider` interface defining the contract
- `lib/data.ts` — factory that picks provider based on `NEXT_PUBLIC_DATA_PROVIDER` env var (default: localStorage)

No API routes. No SSR. No middleware.

## Entry Points

- `app/page.tsx` (~280 LOC) — main page component, orchestrates all state, session CRUD, points calculation, level-up detection, shoutbox integration
- `app/layout.tsx` — root layout, loads Google fonts (Geist), wraps children in `ClientLayout`
- `app/components/ClientLayout.tsx` — wraps app in `PageProvider` context

## Core Data Layer (`lib/`)

| File | Purpose |
|---|---|
| `store.ts` (~240 LOC) | Standalone localStorage CRUD module (duplicates `local-provider.ts` — legacy, still exported but `data.ts` uses the provider pattern instead) |
| `data-provider.ts` | TypeScript interface for `DataProvider` |
| `local-provider.ts` | localStorage implementation of `DataProvider` |
| `supabase-provider.ts` | Supabase implementation — delegates reads to `LocalStorageProvider`, fire-and-forget writes to Supabase |
| `supabase.ts` | Supabase client init + duplicate type definitions |
| `constants.ts` | Session types, class levels, avatar levels, thresholds, point multipliers, pure helper functions |
| `analytics.ts` | No-op analytics stub (all methods are empty) |
| `data.ts` | Provider factory + re-exports |

## State Management

- `app/contexts/PageContext.tsx` — React context for SPA-style page navigation (home, log, history, avatar, ranking, profile, sparring)
- All app state lives in `page.tsx` via `useState`/`useEffect`/`useMemo`/`useCallback` — no external state library

## UI Components (`app/components/`)

| Component | Purpose |
|---|---|
| `AuthGate` | Checks for existing user in data store, shows `LoginScreen` if none |
| `LoginScreen` | Username input form, creates user with `crypto.randomUUID()` |
| `Header` | Sticky header with home link, back button, sign out, version display |
| `HomePage` | Dashboard: avatar display, session count, level progress, navigation grid |
| `LogSession` | Form to log a training session (date, type, level) |
| `HistoryPage` | Session history list with delete capability |
| `AvatarEvolutionPage` | Shows all 4 avatar levels with current progress |
| `GroupRankingPage` | Leaderboard sorted by score, click to view profile |
| `UserProfilePage` | Individual fighter profile with stats and session history |
| `RequiresUsernameGate` | Blocks access to features if username not set |
| `SparringSessions` | Create/accept/cancel sparring requests |
| `Shoutbox` | Chat/activity feed with rate limiting (10s between messages) |
| `AvatarImage` | Renders fighter avatar PNG with optional glow effect |
| `ChatFAB` | Floating action button to toggle shoutbox overlay |

## Points & Leveling System

- Base points per session from class level multiplier (Basic=1.0, Intermediate=1.5, Advanced=2.0, All Level=1.3)
- Weekly diversity bonus: +0.5 per unique session type in the same week (max +1.5)
- 4 avatar levels: Novice (0-7), Intermediate (8-15), Seasoned (16-24), Elite (25+)
- Progress within level quantized to 25% increments
- Badges: "Most Balanced" (5+ types, 10+ sessions), "Best Striker", "Best Grappler", "Best Wrestler"

## Database (Supabase)

SQL migrations in `mma-tracker/supabase/migrations/`:
- `sessions` table with RLS (user can only access own)
- `analytics_events` table with RLS (insert only)
- `user_settings` table with RLS
- `shoutbox_messages` table with RLS
- `group_members` table (referenced in code but no migration file present)
- `sparring_sessions` table (referenced in code but no migration file present)

## Deployment

- `vercel.json` with SPA rewrite rule
- Standard Next.js build (`next build` / `next start`)
