# NSCENE Real Web Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current public NSCENE shell into a real, URL-addressable web product with verified Live, Uploads, Watch, and Creator surfaces backed by the repository's existing API/data model, while keeping unsupported lanes honest.

**Architecture:** Keep the existing Expo 57 / React Native Web application and Go API. Replace local-only section state with web-addressable navigation, add one typed API boundary, reuse the existing `/api/v1/videos` read endpoints for Live and Uploads, add a minimal public creator read model to the Go API, and use the same watch surface for live and uploaded media. Do not invent Clips, Shows, or Communities data; they remain explicit empty/unavailable lanes until their own implementation plan adds real models and APIs.

**Tech Stack:** Expo 57, React 19, React Native 0.86, React Navigation 7, TypeScript 6, Jest 29, Testing Library React Native, Go, Gin, PostgreSQL, Redis, Expo Video installed through `npx expo install expo-video`.

**Spec:** `docs/superpowers/specs/2026-10-15-nscene-cross-platform-product-design.md`

## Global Constraints

- Public product name is `NSCENE`.
- Tagline is `See It. Share It. Live It.`.
- Motto is `Built to amplify, not manipulate.`.
- Primary production domain is `nscene.live`; `nscene.watch` is a secondary/marketing domain that redirects to `nscene.live`.
- Primary public navigation remains exactly `LIVE | UPLOADS | CLIPS | SHOWS | CREATORS | COMMUNITIES`.
- Browsing remains public; identity-bound actions remain authenticated.
- Studio stays out of primary public navigation.
- Never fabricate creator names, media records, live sessions, viewer counts, engagement counts, shows, clips, or community activity.
- Preserve existing native bundle IDs, provider IDs, database IDs, Go Live flow, moderation foundations, and account implementation unless a task explicitly changes an interface.
- Empty production datasets render a polished empty state, not seeded fake activity.
- Use the approved NSCENE visual direction: base `#070A0F`, elevated `#0D1117`, card `#151B23`, primary text `#F8FAFC`, signal blue `#6D8CFF`, LIVE red `#FF4D5A`, success `#42D392`.

## Review Focus

- A direct browser load or refresh of `/uploads`, `/watch/:id`, or `/creator/:id` must render the requested public surface rather than resetting to Live.
- Missing or unreachable API configuration must render an unavailable/error state and must not silently substitute mock data.
- Empty API responses must render useful empty states without presenting content as if it exists.
- Invalid media/creator IDs must render a not-found state without crashing the shell or leaking raw backend errors.
- Signed-out users may browse every public route, while protected routes/actions still require authentication.

---

### Task 1: Pin the domain, theme, and route contract

**Files:**
- Modify: `src/product.ts`
- Modify: `src/theme.ts`
- Create: `src/routes.ts`
- Modify: `__tests__/product.test.ts`
- Create: `__tests__/routes.test.ts`

**Interfaces:**
- Produces: `productIdentity.domain === 'nscene.live'`, `productIdentity.secondaryDomain === 'nscene.watch'`.
- Produces: `publicRouteFor(section: PublicSection): string`, `watchRoute(id: number): string`, `creatorRoute(id: number): string`.
- Produces: NSCENE semantic theme tokens matching the approved design values.

- [ ] **Step 1:** Update/add failing tests that assert `nscene.live`, `nscene.watch`, the six canonical public paths, `/watch/42`, `/creator/7`, and the exact approved color tokens.
- [ ] **Step 2:** Run `npm run test:ci -- __tests__/product.test.ts __tests__/routes.test.ts` and verify RED.
- [ ] **Step 3:** Implement the smallest product, route, and theme contract that satisfies the tests without renaming native/internal identifiers.
- [ ] **Step 4:** Run the focused tests and `npm run typecheck`; expect PASS.
- [ ] **Step 5:** Commit with `feat: pin NSCENE web contract`.

### Task 2: Make the public shell URL-addressable

**Files:**
- Modify: `App.tsx`
- Modify: `src/appShell.ts`
- Create: `src/navigation/PublicNavigator.tsx`
- Modify: `__tests__/AppShell.test.tsx`
- Create: `__tests__/PublicNavigator.test.tsx`

**Interfaces:**
- Consumes: route helpers from Task 1.
- Produces: browser-addressable public routes for `/live`, `/uploads`, `/clips`, `/shows`, `/creators`, `/communities`, `/watch/:id`, and `/creator/:id` plus protected `/studio` and `/account`.

- [ ] **Step 1:** Write failing tests proving direct navigation to each public route works signed out, refresh-safe route state does not fall back to Live, and Studio remains absent from the six-item public nav.
- [ ] **Step 2:** Run the focused shell/navigation tests and verify RED against the current local `useState` routing.
- [ ] **Step 3:** Implement React Navigation linking with the route map from Task 1 and preserve account/sign-in behavior.
- [ ] **Step 4:** Run focused tests, the full Jest suite, and `npm run typecheck`; expect PASS.
- [ ] **Step 5:** Commit with `feat: add NSCENE web routes`.

### Task 3: Add one typed public API boundary

**Files:**
- Create: `src/api/publicClient.ts`
- Create: `src/api/types.ts`
- Create: `__tests__/publicClient.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `listVideos(options?: { live?: boolean; limit?: number; offset?: number }): Promise<VideoWithEngagement[]>`.
- Produces: `getVideo(id: number): Promise<VideoWithEngagement>`.
- Produces: `listUserVideos(userId: number, options?: { limit?: number; offset?: number }): Promise<VideoWithEngagement[]>`.
- Produces: `listCreators(options?: { limit?: number; offset?: number }): Promise<PublicCreator[]>` and `getCreator(id: number): Promise<PublicCreator>` after Task 4 lands.
- Uses `EXPO_PUBLIC_API_URL`; no hard-coded production URL and no mock-data fallback.

- [ ] **Step 1:** Write failing request/response tests for query encoding, success parsing, 404 mapping, malformed payload rejection, and missing base URL behavior.
- [ ] **Step 2:** Run `npm run test:ci -- __tests__/publicClient.test.ts`; verify RED.
- [ ] **Step 3:** Implement the typed client with a small exported error type such as `PublicApiError` and add the env key to `.env.example`.
- [ ] **Step 4:** Run focused tests and `npm run typecheck`; expect PASS.
- [ ] **Step 5:** Commit with `feat: add public API client`.

### Task 4: Add public creator read APIs

**Files:**
- Modify: `backend/internal/models/models.go`
- Modify: `backend/internal/auth/repository.go`
- Modify: `backend/internal/auth/service.go`
- Modify: `backend/internal/auth/handler.go`
- Modify: `backend/cmd/api/main.go`
- Test: corresponding `backend/internal/auth/*_test.go` files; create focused handler/service tests where missing.

**Interfaces:**
- Produces Go `PublicCreator` containing only `id`, `username`, `display_name`, `bio`, and `avatar_url`.
- Produces `GET /api/v1/creators?limit=&offset=` returning creators with at least one video record.
- Produces `GET /api/v1/creators/:id` returning one public creator or 404.
- Must never expose email, password hash, adult-mode flags, or other private account fields.

- [ ] **Step 1:** Write failing repository/service/handler tests for list, get, empty list, 404, pagination limits, and private-field exclusion.
- [ ] **Step 2:** Run focused Go tests and verify RED.
- [ ] **Step 3:** Implement the minimal public creator read model, queries, service methods, handlers, and routes.
- [ ] **Step 4:** Run `cd backend && go test ./...`; expect PASS.
- [ ] **Step 5:** Commit with `feat: add public creator read API`.

### Task 5: Build reusable media and async-state components

**Files:**
- Create: `src/components/media/MediaCard.tsx`
- Create: `src/components/media/MediaGrid.tsx`
- Create: `src/components/media/AsyncState.tsx`
- Create: `__tests__/MediaCard.test.tsx`
- Create: `__tests__/AsyncState.test.tsx`

**Interfaces:**
- Consumes: `VideoWithEngagement` from Task 3.
- Produces: responsive media cards with truthful LIVE status, creator attribution by user ID until creator data is loaded, verified engagement values only, keyboard/touch accessibility, and an `onOpen(videoId)` callback.
- Produces: shared loading, empty, unavailable, error, and not-found states.

- [ ] **Step 1:** Write failing tests for LIVE labeling, absence of invented metrics, accessibility labels, empty/error copy, and press behavior.
- [ ] **Step 2:** Run focused tests and verify RED.
- [ ] **Step 3:** Implement components using Task 1 theme tokens and no embedded demo records.
- [ ] **Step 4:** Run focused tests and `npm run typecheck`; expect PASS.
- [ ] **Step 5:** Commit with `feat: add NSCENE media primitives`.

### Task 6: Replace Live and Uploads placeholders with verified API data

**Files:**
- Modify: `src/screens/DiscoveryFeed.tsx`
- Create: `src/screens/UploadsScreen.tsx`
- Modify: `src/screens/PublicLaneScreen.tsx`
- Create: `__tests__/DiscoveryFeed.test.tsx`
- Create: `__tests__/UploadsScreen.test.tsx`

**Interfaces:**
- Live consumes `listVideos({ live: true })`.
- Uploads consumes `listVideos({ live: false })`.
- Both open `/watch/:id` through Task 2 navigation.

- [ ] **Step 1:** Write failing tests for loading, real returned records, empty datasets, API unavailable/error behavior, and navigation to the selected video.
- [ ] **Step 2:** Run focused tests and verify RED against current placeholder surfaces.
- [ ] **Step 3:** Implement data-backed Live and Uploads screens using Task 5 components; never seed local production-looking content.
- [ ] **Step 4:** Run focused tests, full Jest, and `npm run typecheck`; expect PASS.
- [ ] **Step 5:** Commit with `feat: wire live and uploads browse`.

### Task 7: Add the real watch/player surface

**Files:**
- Modify: `package.json` and lockfile through `npx expo install expo-video`.
- Create: `src/screens/WatchScreen.tsx`
- Create: `src/components/media/VideoPlayer.tsx`
- Create: `__tests__/WatchScreen.test.tsx`
- Modify: `src/navigation/PublicNavigator.tsx`

**Interfaces:**
- Consumes: `getVideo(id)` from Task 3 and route param `id` from Task 2.
- Produces: one watch screen for uploaded and live video using the backend `stream_url`; displays only returned title, description, view/like/comment/live-viewer values.

- [ ] **Step 1:** Write failing tests for uploaded video, live video, missing `stream_url`, 404, API error, and invalid route ID.
- [ ] **Step 2:** Run focused tests and verify RED.
- [ ] **Step 3:** Install Expo Video with the Expo-compatible installer and implement `VideoPlayer` + `WatchScreen` with captions/PiP/fullscreen affordances only where the library/platform exposes them.
- [ ] **Step 4:** Run focused tests, full Jest, `npm run typecheck`, and `npx expo export --platform web`; expect PASS.
- [ ] **Step 5:** Commit with `feat: add NSCENE watch experience`.

### Task 8: Replace Creators placeholder with real directory and profiles

**Files:**
- Create: `src/screens/CreatorsScreen.tsx`
- Create: `src/screens/CreatorProfileScreen.tsx`
- Create: `src/components/creator/CreatorCard.tsx`
- Create: `__tests__/CreatorsScreen.test.tsx`
- Create: `__tests__/CreatorProfileScreen.test.tsx`
- Modify: `src/navigation/PublicNavigator.tsx`

**Interfaces:**
- Consumes: `listCreators`, `getCreator`, and `listUserVideos` from Task 3/4.
- Produces: `/creators` and `/creator/:id` backed only by returned creator/video data.

- [ ] **Step 1:** Write failing tests for creator list, empty list, profile + uploads, profile with no uploads, 404, and API failure.
- [ ] **Step 2:** Run focused tests and verify RED.
- [ ] **Step 3:** Implement directory/profile surfaces with the approved responsive hierarchy and no fabricated verification badge or follower counts.
- [ ] **Step 4:** Run focused tests, full Jest, and `npm run typecheck`; expect PASS.
- [ ] **Step 5:** Commit with `feat: wire creator discovery`.

### Task 9: Preserve honest unsupported lanes and finish responsive/accessibility QA

**Files:**
- Modify: `src/screens/PublicLaneScreen.tsx`
- Modify: `App.tsx` and navigation/components only where QA exposes defects.
- Modify/create focused tests for discovered defects.

**Interfaces:**
- Keeps Clips, Shows, and Communities explicit as not-yet-connected product lanes pending their own data-model plans.
- Ensures desktop, tablet, and narrow-web navigation remains usable and all interactive controls have meaningful accessibility labels/focus behavior.

- [ ] **Step 1:** Add failing regression tests for any discovered narrow-layout, keyboard/focus, protected-route, or unsupported-lane defects.
- [ ] **Step 2:** Implement only the fixes required by those tests.
- [ ] **Step 3:** Run `npm run verify`, `npx expo export --platform web`, and `cd backend && go test ./...`; expect PASS.
- [ ] **Step 4:** Commit with `fix: complete NSCENE web core QA`.

### Task 10: Preview deployment verification

**Files:**
- No product-code changes unless verification identifies a defect.

**Interfaces:**
- Produces a Vercel preview tied to the exact branch head and a deployment note listing backend/API configuration still required for full runtime data.

- [ ] **Step 1:** Verify branch diff and commit sequence match Tasks 1–9.
- [ ] **Step 2:** Verify GitHub status checks and Vercel preview succeed for the exact head SHA.
- [ ] **Step 3:** Exercise `/live`, `/uploads`, one `/watch/:id`, `/creators`, one `/creator/:id`, and each honest unsupported lane against a reachable backend; record unavailable states separately if the backend is not deployed/configured.
- [ ] **Step 4:** Do not attach `nscene.live` or redirect `nscene.watch` until preview verification passes and production backend reachability is confirmed.
- [ ] **Step 5:** Report the next separate plans required for Clips, Shows, Communities, live chat/control-room integration, search/library depth, and production domain cutover.