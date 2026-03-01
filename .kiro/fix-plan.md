# FightMate — Fix Plan

Ordered by dependency. Later phases build on earlier ones. Each task lists the files it touches.

---

## Phase 1: Dead Code & Type Cleanup

Zero behavior change. Just remove duplication and confusion.

### 1.1 Delete `store.ts`

`lib/store.ts` is a ~240 LOC standalone localStorage module that duplicates `local-provider.ts` exactly. Nothing imports it (the app uses `lib/data.ts` → `LocalStorageProvider`).

- Delete `lib/store.ts`
- Grep the codebase to confirm zero imports (there shouldn't be any, but verify)

### 1.2 Consolidate type definitions to `data-provider.ts`

Types (`GroupMember`, `SparringSession`, `DbSession`, `ShoutboxMessage`, `LocalUser`) are defined in 3 places:
- `data-provider.ts` (canonical)
- `store.ts` (being deleted in 1.1)
- `supabase.ts` (duplicate + unused `AnalyticsEvent`)

After deleting `store.ts`:
- Remove all type/interface definitions from `supabase.ts`, keep only the client init
- Remove the unused `AnalyticsEvent` interface entirely
- Ensure all imports across the codebase point to `data-provider.ts` (via `lib/data.ts` re-exports)

Files: `lib/supabase.ts`, `lib/data.ts`, any component that imports types from `supabase.ts`

### 1.3 Deduplicate Supabase client creation

`supabase.ts` creates a client. `supabase-provider.ts` creates its own independent client. There should be one.

- `supabase-provider.ts`: import the client from `supabase.ts` instead of creating a new one
- Remove the `createClient` call and env var reads from `supabase-provider.ts`

Files: `lib/supabase.ts`, `lib/supabase-provider.ts`

### 1.4 Delete no-op analytics module or mark it clearly

`lib/analytics.ts` is a class where every method is empty. It's imported and called in `page.tsx`.

Two options (pick one):
- **Option A**: Delete `analytics.ts`, remove all `analytics.*` calls from `page.tsx`. Simplest.
- **Option B**: Keep it as a hook point but add a comment `// Stub — implement when analytics provider is chosen` at the top.

Recommendation: Option A. It's noise. Add it back when there's a real analytics provider.

Files: `lib/analytics.ts`, `app/page.tsx`

---

## Phase 2: URL-Based Routing

Replace the `PageContext` SPA routing with Next.js file-based routing. This gives us browser back/forward, deep linking, shareable URLs, and makes the Next.js framework actually useful.

### 2.1 Create route files

Create Next.js route segments for each page:

```
app/
  page.tsx          → home (dashboard)
  log/page.tsx      → log session
  history/page.tsx  → session history
  avatar/page.tsx   → avatar evolution
  ranking/page.tsx  → group ranking
  profile/page.tsx  → user profile (with ?userId= query param)
  sparring/page.tsx → sparring sessions
```

Each new `page.tsx` is a thin wrapper that renders the existing component with the required props.

### 2.2 Lift shared state into a context or layout

Currently `page.tsx` holds all state (sessions, userId, username, groupMembers, etc.). This needs to move to a shared context so all route pages can access it.

Create `app/contexts/AppContext.tsx`:
- Holds: userId, username, sessions, groupMembers, avatar, currentUserScore, currentUserBadges
- Provides: addSession, deleteSession, handleSignOut, fetchSessions, fetchGroupMembers
- Wraps the app in `app/layout.tsx` (inside `ClientLayout`)

### 2.3 Update navigation

- Replace all `setPage("xyz")` calls with Next.js `<Link href="/xyz">` or `useRouter().push("/xyz")`
- Delete `app/contexts/PageContext.tsx`
- Update `Header` to use `usePathname()` instead of `currentPage` state
- Remove the `vercel.json` SPA rewrite (Next.js handles routing natively)

### 2.4 Update `RequiresUsernameGate`

- Instead of redirecting to "home" via context, use `redirect("/")` or `useRouter().push("/")`

Files: all `app/components/*.tsx`, `app/contexts/PageContext.tsx` (delete), new `app/*/page.tsx` files, `app/layout.tsx`, `vercel.json`

---

## Phase 3: Fix SupabaseProvider

### 3.1 Add `init()` hydration method

The comment says to call `init()` but it doesn't exist. Implement it:

- Add `async init(userId: string)` to `DataProvider` interface (optional method or separate `InitializableProvider` interface)
- In `SupabaseProvider.init()`:
  - Fetch sessions, members, sparring sessions, shoutbox messages from Supabase
  - Write them into the `LocalStorageProvider` cache
  - Notify all subscription keys so UI updates
- Call `init()` from `AppContext` (Phase 2) after auth resolves
- `LocalStorageProvider.init()` can be a no-op

Files: `lib/data-provider.ts`, `lib/supabase-provider.ts`, `lib/local-provider.ts`, `app/contexts/AppContext.tsx`

### 3.2 Add write retry queue

Replace fire-and-forget `.then()` with a simple retry mechanism:

- Create `lib/write-queue.ts`: a queue that stores pending writes in localStorage (so they survive page refresh)
- On each write: push to queue, attempt Supabase call, on success remove from queue, on failure retry with exponential backoff (max 3 retries)
- On `init()`: flush any pending writes from previous sessions
- Show a subtle UI indicator when writes are pending/failing (e.g., small orange dot in header)

Files: new `lib/write-queue.ts`, `lib/supabase-provider.ts`, `app/components/Header.tsx`

### 3.3 Add Supabase realtime subscriptions

For multi-user features (ranking, shoutbox, sparring) to work, the app needs to receive updates from other users.

- In `SupabaseProvider.init()`, subscribe to Supabase Realtime channels for:
  - `shoutbox_messages` (INSERT)
  - `group_members` (INSERT, UPDATE)
  - `sparring_sessions` (INSERT, UPDATE)
- On receiving a realtime event, update the local cache and `notify()` the relevant key
- Add cleanup in a `destroy()` method to unsubscribe

Files: `lib/supabase-provider.ts`, `lib/data-provider.ts`

### 3.4 Add missing Supabase migrations

Create migration files for the two tables that are written to but have no DDL:

- `supabase/migrations/20250127_group_members.sql`: `group_members` table with composite unique on `(user_id, group_id)`, RLS policies (all authenticated users can read, users can only write their own row)
- `supabase/migrations/20250128_sparring_sessions.sql`: `sparring_sessions` table, RLS policies (all authenticated can read, creator can insert/update/cancel)

Files: new migration SQL files

---

## Phase 4: Authentication

### 4.1 Add Supabase Auth

Replace the current "pick a username, get a UUID" flow with real Supabase auth:

- Add email/password sign-up and sign-in (Supabase Auth handles this)
- Optionally add OAuth providers (Google, GitHub) — low effort with Supabase
- After auth, prompt for username (keep the current username picker as an onboarding step post-auth)
- Store the Supabase `auth.uid()` as the user ID instead of a random UUID

### 4.2 Update `AuthGate` and `LoginScreen`

- `AuthGate`: check `supabase.auth.getSession()` instead of `db.getUser()`
- `LoginScreen`: replace with email/password form + OAuth buttons
- Add a `SignUpScreen` or combine into one form with toggle
- On successful auth, check if username exists in `group_members`; if not, show username picker

### 4.3 Server-side username uniqueness

- Add a Supabase unique constraint on `group_members.username` (where username is not null)
- `isUsernameTaken()` in `SupabaseProvider`: query Supabase instead of local cache
- Handle the race condition with a proper DB constraint + error handling

### 4.4 Keep localStorage-only mode working

- `LocalStorageProvider` auth flow stays as-is (username → UUID) for offline/demo use
- The provider factory in `data.ts` determines which flow runs

Files: `app/components/AuthGate.tsx`, `app/components/LoginScreen.tsx` (rewrite), `lib/supabase-provider.ts`, `lib/data-provider.ts`, new migration for unique constraint

---

## Phase 5: Logic Bug Fixes

### 5.1 Fix `LogSession` passing `points: 0`

`LogSession` creates a session object with `points: 0`, then `page.tsx`'s `addSession` calculates real points and passes them to `db.addSession`. The `points: 0` from LogSession is misleading.

- Change `LogSession`'s `onAddSession` prop type to exclude `points` (and `group_id` while we're at it)
- `LogSession` only passes `{ date, type, level }`
- The parent (`addSession` in AppContext after Phase 2) adds `group_id` and `points`

Files: `app/components/LogSession.tsx`, `app/page.tsx` (or `AppContext` after Phase 2)

### 5.2 Fix `RequiresUsernameGate` flash on load

The gate shows "Username Required" briefly because `username` is null until `initializeUser` runs async.

- Add a `usernameLoading` state (or derive it from `authLoading`)
- `RequiresUsernameGate` shows a loading spinner while `usernameLoading` is true, only shows the "Username Required" message after loading is complete and username is still null

Files: `app/components/RequiresUsernameGate.tsx`, `app/page.tsx` or `AppContext`

### 5.3 Fix level-up detection on multi-batch session load

If sessions load in multiple batches, `prevAvatarLevelRef` could trigger a false level-up.

- Don't set `prevAvatarLevelRef` until the initial fetch is complete
- Add a `initialLoadComplete` ref, set it to true after `fetchSessions` runs the first time
- Only run level-up detection when `initialLoadComplete` is true

Files: `app/page.tsx` or `AppContext`

### 5.4 Fix `UserProfilePage` showing 0 sessions for other users

In localStorage mode, `db.getSessions(otherUserId)` returns nothing because only the current user's sessions exist locally.

- In `SupabaseProvider`: add a `getSessionsForUser(userId)` method that fetches directly from Supabase (not cache) for non-current users
- In `LocalStorageProvider`: same method returns from local store (works for current user only, returns empty for others — expected)
- `UserProfilePage`: use this method, show a message like "Session history not available in offline mode" when in localStorage mode and viewing another user

Files: `lib/data-provider.ts`, `lib/supabase-provider.ts`, `lib/local-provider.ts`, `app/components/UserProfilePage.tsx`

### 5.5 Fix Shoutbox `onNewMessages` infinite re-render risk

`fetchMessages` has `onNewMessages` in its `useCallback` deps. If the parent passes an unstable reference, this loops.

- Remove `onNewMessages` from `useCallback` deps by using a ref:
  ```ts
  const onNewMessagesRef = useRef(onNewMessages);
  onNewMessagesRef.current = onNewMessages;
  ```
  Then call `onNewMessagesRef.current?.(mapped)` inside `fetchMessages`

Files: `app/components/Shoutbox.tsx`

---

## Phase 6: UX Improvements

### 6.1 Replace `alert()` and `confirm()` with inline UI

- Create a simple `Toast` component for success/error messages
- Create a `ConfirmDialog` component (modal) for destructive actions
- Replace all `alert()` calls (LoginScreen, SparringSessions, Shoutbox) with toast
- Replace `confirm()` in `deleteSession` and `handleCancelSession` with `ConfirmDialog`

Files: new `app/components/Toast.tsx`, new `app/components/ConfirmDialog.tsx`, all components that use `alert()`/`confirm()`

### 6.2 Add session editing

- Add an "Edit" button next to each session in `HistoryPage`
- Clicking it opens the `LogSession` form pre-filled with the session's data
- Add `updateSession(id, updates)` to `DataProvider` interface and both providers
- Add corresponding Supabase migration if needed (update RLS already exists)

Files: `lib/data-provider.ts`, `lib/local-provider.ts`, `lib/supabase-provider.ts`, `app/components/HistoryPage.tsx`, `app/components/LogSession.tsx`

### 6.3 Add pagination

- `HistoryPage`: paginate sessions (20 per page) with "Load more" or page buttons
- `Shoutbox`: already limited to 30 messages, add "Load older" button that increases the limit
- `GroupRankingPage`: paginate if member count exceeds 20

Files: `app/components/HistoryPage.tsx`, `app/components/Shoutbox.tsx`, `app/components/GroupRankingPage.tsx`

### 6.4 Add input validation on shoutbox (server-side)

- Add a Supabase check constraint on `shoutbox_messages.content`: `length(content) <= 200`
- Add a rate-limit function or Supabase Edge Function that enforces 1 message per 10s per user server-side (the client-side check is easily bypassed)

Files: new migration SQL, optionally a Supabase Edge Function

---

## Phase 7: Testing

No tests exist today. Add comprehensive unit and integration tests.

### 7.1 Test infrastructure setup

- Install Vitest (fast, Vite-native, works well with Next.js), React Testing Library, and jsdom
- Add `vitest.config.ts` at `mma-tracker/` root with jsdom environment, path aliases matching `tsconfig.json`
- Add a `test` script to `package.json`: `"test": "vitest"`, `"test:ci": "vitest run"`
- Create `lib/__tests__/` and `app/components/__tests__/` directories
- Create `lib/__tests__/test-utils.ts` with:
  - A `mockLocalStorage()` helper that provides an in-memory `Storage` implementation (so tests don't touch real localStorage)
  - A `renderWithProviders()` wrapper that wraps components in `PageProvider` (and later `AppContext`) for component tests
  - A `createMockProvider()` factory that returns a `DataProvider` with jest/vi spies on every method

Files: new `vitest.config.ts`, `package.json`, `lib/__tests__/test-utils.ts`

### 7.2 Unit tests — `constants.ts`

Pure functions, easiest to test. Full coverage.

`lib/__tests__/constants.test.ts`:
- `calculateLevelFromPoints`: test boundary values — 0→Novice, 7→Novice, 8→Intermediate, 15→Intermediate, 16→Seasoned, 24→Seasoned, 25→Elite, 100→Elite, negative→Novice
- `calculateProgressInLevel`: test each level at 0%, 25%, 50%, 75%, 100% boundaries. Test Elite always returns 100 when at/above threshold. Test rounding to 25% increments.
- `getLevelColor`: test all 4 levels return expected gradient strings, test unknown string returns default
- `parseDateUTC`: test "2025-01-15" returns correct UTC date, test month/day boundaries (e.g., "2025-12-31")
- `normalizeDateToISO`: test already-normalized passthrough, test empty string returns empty, test invalid date returns input unchanged
- `deriveAvatarFromSessions`: test empty array → Novice/0/0, test sessions summing to each level threshold, test sessions with missing `points` field

### 7.3 Unit tests — `LocalStorageProvider`

Test every method of the provider against the mock localStorage.

`lib/__tests__/local-provider.test.ts`:

**Auth:**
- `getUser()` returns null when no user set
- `setUser()` stores user and creates a group_members entry
- `setUser()` with existing user updates username in members
- `signOut()` clears user but preserves other data
- `setUser()` notifies USER and MEMBERS subscribers

**Sessions:**
- `getSessions(userId)` returns empty array for unknown user
- `addSession()` creates session with generated id, created_at, updated_at
- `addSession()` notifies SESSIONS subscribers
- `getSessions()` returns only sessions for the given userId, sorted by date descending
- `deleteSession()` removes the session and notifies
- `deleteSession()` with non-existent id is a no-op (no crash)

**Group Members:**
- `getMembers()` returns empty array initially
- `upsertMember()` inserts new member
- `upsertMember()` updates existing member (matched by user_id + group_id)
- `getMemberUsername()` returns null for unknown user
- `getMemberUsername()` returns username after upsert
- `isUsernameTaken()` returns false when no members
- `isUsernameTaken()` returns true for taken name, false with excludeUserId matching

**Sparring:**
- `getSparringSessions()` returns empty initially
- `addSparringSession()` creates with id and timestamps
- `updateSparringSession()` updates fields and updated_at
- `updateSparringSession()` with non-existent id is a no-op
- Sessions sorted by date ascending

**Shoutbox:**
- `getShoutboxMessages()` returns empty initially
- `addShoutboxMessage()` creates with id and created_at
- `getShoutboxMessages(limit)` respects limit, returns newest first
- Notifies SHOUTBOX subscribers on add

**Subscriptions:**
- `subscribe()` returns an unsubscribe function
- Calling unsubscribe stops notifications
- Multiple subscribers on same key all get notified
- Subscribing to one key doesn't fire on another key's notify

### 7.4 Unit tests — `SupabaseProvider`

Test that it delegates reads to local and fires Supabase writes.

`lib/__tests__/supabase-provider.test.ts`:

- Mock the Supabase client (`vi.mock("@supabase/supabase-js")`) to return a mock with `.from().insert()`, `.from().delete()`, `.from().upsert()`, `.from().update()` that return resolved promises
- Mock `LocalStorageProvider` or use the real one with mock localStorage
- Test each write method (addSession, deleteSession, upsertMember, addSparringSession, updateSparringSession, addShoutboxMessage):
  - Calls the corresponding local provider method
  - Calls the correct Supabase table/operation
  - Returns the locally-created object (not waiting for Supabase)
- Test each read method delegates to local provider
- Test `signOut()` calls both local signOut and `supabase.auth.signOut()`
- Test Supabase write failure logs error but doesn't throw

### 7.5 Unit tests — `data.ts` provider factory

`lib/__tests__/data.test.ts`:
- When `NEXT_PUBLIC_DATA_PROVIDER` is unset, returns `LocalStorageProvider`
- When set to `"supabase"`, returns `SupabaseProvider`
- When set to any other value, returns `LocalStorageProvider`

### 7.6 Unit tests — points calculation in `page.tsx`

The `calculateWeeklyDiversityBonus` and `addSession` logic in `page.tsx` contain business logic that should be extracted and tested. As part of testing, extract these into `lib/points.ts`:

`lib/__tests__/points.test.ts`:
- `calculateWeeklyDiversityBonus`:
  - No existing sessions in the week → 0 bonus
  - 1 existing session same type → 0 bonus
  - 1 existing session different type → 0.5 bonus
  - 4 existing sessions all different types + new different type → 1.5 bonus (capped)
  - Sessions from different weeks don't count
  - Week boundary: Sunday start
- Points calculation:
  - Basic session → 1.0 points
  - Intermediate session → 1.5 points
  - Advanced session → 2.0 points
  - All Level session → 1.3 points
  - Unknown level → 1.0 points (fallback)
  - Points = multiplier + diversity bonus

### 7.7 Unit tests — badge calculation

Extract badge logic from `page.tsx` into `lib/badges.ts` and test:

`lib/__tests__/badges.test.ts`:
- No sessions → no badges
- 10+ sessions with 5+ unique types → "Most Balanced"
- 9 sessions with 5 types → no "Most Balanced" (need 10)
- 5+ striking sessions (Boxing/Muay Thai/K1/MMA), more than grappling → "Best Striker"
- 5+ grappling sessions (BJJ/Wrestling/Judo/Takedowns), more than striking → "Best Grappler"
- Equal striking and grappling → neither badge
- 3+ Wrestling sessions → "Best Wrestler"
- Multiple badges can be earned simultaneously

### 7.8 Component tests — `LoginScreen`

`app/components/__tests__/LoginScreen.test.tsx`:
- Renders username input and submit button
- Submit button disabled when input is empty
- Valid username (3-20 chars, alphanumeric/underscore/hyphen) submits successfully
- Invalid username (too short, too long, special chars) shows validation error
- Calls `db.setUser()` with generated UUID and trimmed username on submit
- Calls `window.location.reload()` after successful submit

### 7.9 Component tests — `AuthGate`

`app/components/__tests__/AuthGate.test.tsx`:
- Shows loading state initially
- When `db.getUser()` returns null → renders `LoginScreen`
- When `db.getUser()` returns a user → renders children, sets userId
- Calls `setAuthLoading(false)` after checking user

### 7.10 Component tests — `Header`

`app/components/__tests__/Header.test.tsx`:
- Renders "FightMate" brand text
- Shows version number
- "Sign Out" button calls `onSignOut` prop
- "Back" button only visible when not on home page
- Clicking "FightMate" navigates to home

### 7.11 Component tests — `LogSession`

`app/components/__tests__/LogSession.test.tsx`:
- Renders date, type, and level inputs
- All session types from `SESSION_TYPES` available in dropdown
- All class levels from `CLASS_LEVELS` available in dropdown
- Submit without date shows alert / validation
- Successful submit calls `onAddSession` with correct shape `{ date, type, level, group_id, points: 0 }`
- Form resets after submit
- Navigates to history page after submit

### 7.12 Component tests — `HistoryPage`

`app/components/__tests__/HistoryPage.test.tsx`:
- Empty sessions → shows "No sessions logged yet" message
- Renders session count in subtitle
- Each session shows date, type, level
- Delete button calls `onDelete` with session id
- Sessions displayed in order provided (already sorted by parent)
- Date formatting works correctly

### 7.13 Component tests — `Shoutbox`

`app/components/__tests__/Shoutbox.test.tsx`:
- Renders "No messages yet" when empty
- Renders messages with display name, content, and relative time
- Input field and Send button present
- Empty message can't be sent
- Message over 200 chars shows error
- Rate limiting: second message within 10s shows error
- Calls `db.addShoutboxMessage()` with correct user_id, type "user", and content
- Subscribes to SHOUTBOX key on mount, unsubscribes on unmount

### 7.14 Component tests — `SparringSessions`

`app/components/__tests__/SparringSessions.test.tsx`:
- Shows warning when username is null
- Create form requires date, time, location
- Successful creation calls `db.addSparringSession()` and `db.addShoutboxMessage()`
- Own sessions show "Cancel" button, others show "Accept" button
- Accept calls `db.updateSparringSession()` with status "accepted"
- Cancel calls `db.updateSparringSession()` with status "cancelled"
- Accepted sessions appear in "My Upcoming" section
- Subscribes to SPARRING key for live updates

### 7.15 Component tests — `GroupRankingPage`

`app/components/__tests__/GroupRankingPage.test.tsx`:
- Renders "No members found" when empty
- Members sorted by score descending
- Current user highlighted with "You" badge
- Top 3 get medal emojis (🥇🥈🥉)
- Clicking a member calls `onSelectUser` with their userId
- Anonymous fighters (no username) filtered out except current user
- Badges rendered for members that have them

### 7.16 Component tests — `AvatarEvolutionPage`

`app/components/__tests__/AvatarEvolutionPage.test.tsx`:
- All 4 avatar levels rendered
- Current level marked as "Current"
- Unlocked levels are full opacity, locked levels are dimmed/grayscale
- Progress bar width matches `avatar.progress`
- Progress text matches expected label for each 25% increment
- Next level text shown (or "Max Level" for Elite)

### 7.17 Component tests — `UserProfilePage`

`app/components/__tests__/UserProfilePage.test.tsx`:
- Shows loading state initially
- Renders member name, avatar level, score, session count, badge count
- Renders session history for the selected user
- "Back to Rankings" button navigates to ranking page
- Shows anonymous browsing warning when username is null

### 7.18 Component tests — `ChatFAB`

`app/components/__tests__/ChatFAB.test.tsx`:
- Renders chat button
- Shows unread count badge when > 0
- Hides badge when unread is 0
- Displays "99+" when count exceeds 99
- Calls `onClick` when clicked

### 7.19 Component tests — `RequiresUsernameGate`

`app/components/__tests__/RequiresUsernameGate.test.tsx`:
- When username is null → shows "Username Required" message and back button
- When username is set → renders children
- Back button navigates to home

### 7.20 Integration tests — full session lifecycle

`app/__tests__/session-lifecycle.test.tsx`:

Test the full flow using `LocalStorageProvider` with mock localStorage:
1. User signs up with username → user created in store, member entry created
2. User logs a session (Boxing, Advanced) → session stored with correct points (2.0), shoutbox system message posted
3. User logs a second session same week different type (BJJ, Basic) → points include diversity bonus (1.0 + 0.5 = 1.5)
4. Avatar level updates based on cumulative points
5. User deletes a session → session removed, avatar recalculated
6. Group members list includes the user with correct score
7. Sign out → user cleared, data preserved

### 7.21 Integration tests — sparring flow

`app/__tests__/sparring-flow.test.tsx`:

Using mock localStorage with two simulated users:
1. User A creates a sparring request → appears in open sessions, shoutbox message posted
2. User B sees the request in available list
3. User B accepts → status changes to "accepted", appears in both users' upcoming
4. User A creates another request then cancels it → status changes to "cancelled"

### 7.22 Integration tests — ranking and badges

`app/__tests__/ranking-badges.test.tsx`:

1. Create 3 users with different session counts/types
2. Verify ranking order matches score descending
3. User with 5+ types and 10+ sessions gets "Most Balanced" badge
4. User with 5+ striking sessions gets "Best Striker"
5. Verify badge appears in ranking list and profile page

### 7.23 Integration tests — level-up flow

`app/__tests__/level-up.test.tsx`:

1. User starts at Novice with 0 points
2. Log sessions until cumulative points cross 8 → level changes to Intermediate
3. Verify shoutbox system message posted for level-up
4. Verify avatar evolution page shows Intermediate as current
5. Continue to Seasoned (16) and Elite (25), verify each transition

### 7.24 Integration tests — shoutbox

`app/__tests__/shoutbox-flow.test.tsx`:

1. User posts a message → appears in message list with correct display name
2. System messages (from session logging, level-ups) appear with correct content
3. Rate limiting: second post within 10s is rejected
4. Messages ordered newest-last (chronological in chat view)
5. Message limit respected (only last 30 shown)

---

## Phase 8: Cleanup & Polish

### 8.1 Remove unused CSS variables

`globals.css` defines `--background` and `--foreground` light-mode variables but the entire app uses dark gradients with Tailwind classes. The light mode variables are never visible.

- Remove the light-mode `:root` variables or commit to supporting light mode properly
- The `@media (prefers-color-scheme: dark)` block is also unused since the app is always dark

Files: `app/globals.css`

### 8.2 Clean up `supabase.ts`

After Phase 1, `supabase.ts` should only contain the client init (2-3 lines). If the warning about missing env vars is still useful, keep it. Remove everything else.

Files: `lib/supabase.ts`

### 8.3 Consider whether Next.js is the right framework

After Phase 2 routing, the app will at least use Next.js routing. But if there's no plan for SSR, API routes, or server components, a lighter framework (Vite + React Router) would be simpler and faster to build/deploy. This is a strategic decision, not a code change.

---

## Execution Order Summary

| Phase | Effort | Risk | Dependency |
|---|---|---|---|
| 1: Dead code cleanup | Small | None | None |
| 2: URL routing | Medium | Medium (touches every component) | None |
| 3: Fix SupabaseProvider | Medium-Large | Medium | Phase 1 |
| 4: Authentication | Medium | Medium | Phase 3 |
| 5: Logic bug fixes | Small-Medium | Low | Phase 2 (for AppContext) |
| 6: UX improvements | Medium | Low | Phase 5 |
| 7: Testing | Large | Low | Phases 1, 5 (extract helpers); Phase 2 (for integration tests) |
| 8: Cleanup | Small | None | All above |

Phases 1 and 5.5 can be done immediately with no dependencies. Phase 2 is the highest-impact change. Phase 3 is required before the app can actually work as a multi-user product. Phase 7 (testing) can start in parallel with Phase 2 — unit tests for `constants.ts`, `LocalStorageProvider`, and `SupabaseProvider` have no dependency on routing changes. Integration tests should wait until Phase 5 (bug fixes + extracted helpers).
