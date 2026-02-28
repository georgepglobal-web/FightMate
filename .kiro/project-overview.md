# FightMate — Project Overview

Next.js 16 (React 19) MMA/martial arts training tracker. Tailwind CSS 4 for styling. Supabase optional backend. Deployed on Vercel.

## Architecture

File-based routing with Next.js App Router. All pages are client-side (`"use client"`). Shared state lives in `AppContext`, and every route is wrapped in `AppShell` (auth gate + header + chat FAB + chat overlay).

Provider-based data abstraction with two interchangeable backends:

- `lib/local-provider.ts` — `LocalStorageProvider`, stores everything in browser localStorage
- `lib/supabase-provider.ts` — `SupabaseProvider`, wraps `LocalStorageProvider` as cache, syncs to Supabase with realtime subscriptions
- `lib/data-provider.ts` — `DataProvider` interface with optional `init()`/`destroy()` lifecycle
- `lib/data.ts` — factory that picks provider based on `NEXT_PUBLIC_DATA_PROVIDER` env var (default: local)

No API routes. No SSR. No middleware.

## Routes

| Route | Page Component |
|---|---|
| `/` | `HomePage` — dashboard with avatar, session count, level progress, nav grid |
| `/log` | `LogSession` — form to log a training session (date, type, level) |
| `/history` | `HistoryPage` — session history list with delete (via ConfirmDialog) |
| `/avatar` | `AvatarEvolutionPage` — all 4 avatar levels with current progress |
| `/ranking` | `GroupRankingPage` — leaderboard, click a user to view their profile |
| `/profile` | `UserProfilePage` — fighter profile with stats and session history |
| `/sparring` | `SparringSessions` — create/accept/cancel sparring requests |

## Core Data Layer (`lib/`)

| File | Purpose |
|---|---|
| `data-provider.ts` | TypeScript interface for `DataProvider` |
| `local-provider.ts` | localStorage implementation with pub/sub |
| `supabase-provider.ts` | Supabase implementation with init hydration and realtime |
| `supabase.ts` | Supabase client init |
| `constants.ts` | Session types, class levels, avatar levels, thresholds, point multipliers |
| `points.ts` | Point calculation and weekly diversity bonus logic |
| `badges.ts` | Badge evaluation (Most Balanced, Best Striker/Grappler/Wrestler) |
| `data.ts` | Provider factory + re-exports |

## State Management

- `app/contexts/AppContext.tsx` — React context holding all shared state (sessions, user, scores, badges, group members, chat, etc.)
- No external state library

## Authentication

Dual-mode, selected by `NEXT_PUBLIC_DATA_PROVIDER`:

- **local** (default): Username picker, no password. User ID generated via `crypto.randomUUID()`.
- **supabase**: Email/password login with sign-up toggle, using Supabase Auth.

`AuthGate` handles both modes. `RequiresUsernameGate` blocks features that need a username.

## UI Components (`app/components/`)

| Component | Purpose |
|---|---|
| `AppShell` | Wraps every route: AuthGate + Header + ChatFAB + ChatOverlay |
| `AuthGate` | Dual-mode auth check, shows `LoginScreen` if unauthenticated |
| `LoginScreen` | Username picker (local) or email/password form (Supabase) |
| `Header` | Sticky header with home link, back button, sign out, version |
| `HomePage` | Dashboard with avatar, stats, navigation grid |
| `LogSession` | Training session form with inline validation |
| `HistoryPage` | Session list with ConfirmDialog-gated delete |
| `AvatarEvolutionPage` | Avatar level progression display |
| `GroupRankingPage` | Leaderboard, clickable rows navigate to user profile |
| `UserProfilePage` | Individual fighter stats and session history |
| `SparringSessions` | Sparring request management with inline errors |
| `Shoutbox` | Chat/activity feed with 10s rate limiting |
| `ChatOverlay` | Overlay wrapper for Shoutbox |
| `ChatFAB` | Floating action button with unread message badge |
| `AvatarImage` | Fighter avatar PNG with optional glow effect |
| `RequiresUsernameGate` | Blocks features if username not set |
| `ConfirmDialog` | Modal confirmation for destructive actions |
| `Toast` | Inline notification component (success/error/info) |

## Points & Leveling System

- Base points per session from class level multiplier (Basic=1.0, Intermediate=1.5, Advanced=2.0, All Level=1.3)
- Weekly diversity bonus: +0.5 per unique session type in the same week (max +1.5)
- 4 avatar levels: Novice (0–7), Intermediate (8–15), Seasoned (16–24), Elite (25+)
- Progress within level quantized to 25% increments
- Badges: "Most Balanced" (5+ types, 10+ sessions), "Best Striker", "Best Grappler", "Best Wrestler"

## Database (Supabase)

Migrations in `supabase/migrations/`:

| Migration | Tables/Changes |
|---|---|
| `20250119_sessions_and_analytics` | `sessions`, `analytics_events` (legacy) with RLS |
| `20250126_user_settings` | `user_settings` with RLS |
| `20250127_group_members` | `group_members` with RLS |
| `20250128_sparring_sessions` | `sparring_sessions` with RLS |
| `20250129_enable_realtime` | Enables realtime on shoutbox, group_members, sparring_sessions |
| `20250130_unique_username` | Unique constraint on username |

## Testing

Vitest + React Testing Library + jsdom. 24 test files, 187 tests.

- Unit tests (6 files): constants, points, badges, local-provider, supabase-provider, data factory
- Component tests (13 files): all UI components
- Integration tests (5 files): session lifecycle, shoutbox flow, sparring flow, level-up, auth flow

## Deployment

- `vercel.json` (empty — no SPA rewrite needed with file-based routing)
- Standard Next.js build (`next build` / `next start`)
