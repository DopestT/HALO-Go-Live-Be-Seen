# NSCENE Public Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current signed-in Tube shell into the public NSCENE browse experience while preserving existing live, Studio, and account behavior.

**Architecture:** Keep the existing Expo/React Native web-capable app and its working live components. Centralize public product metadata/navigation, add an honest reusable lane screen for destinations whose data wiring is not verified, and make authentication gate only protected destinations/actions rather than the whole app.

**Tech Stack:** Expo 57, React 19, React Native 0.86, TypeScript 6, Jest 29, Testing Library React Native.

**Spec:** `docs/superpowers/specs/2026-10-15-nscene-public-site-design.md`

## Global Constraints

- Public name is `NSCENE`.
- Tagline is `See It. Share It. Live It.`
- Motto is `Built to amplify, not manipulate.`
- Primary nav is exactly `LIVE | UPLOADS | CLIPS | SHOWS | CREATORS | COMMUNITIES`.
- Browsing must work signed out.
- Studio is authenticated-only and not a primary nav tab.
- Do not fabricate production content for unwired lanes.
- Preserve existing internal/native identifiers and existing Go Live/account implementations.

## Review Focus

- Signed-out visitors must never be bounced to login merely for browsing.
- Studio must not leak into the public six-tab navigation.
- Selecting an unwired lane must show an honest lane-specific empty state rather than Live content.
- Existing Live discovery must remain the default public surface.
- Narrow layouts must keep navigation usable without changing the six canonical labels.

---

### Task 1: Pin NSCENE product contract

**Files:**
- Create: `src/product.ts`
- Create: `__tests__/product.test.ts`

**Interfaces:**
- Produces: `productIdentity`, `PublicSection`, `publicSections`, `isPublicSection(value)`.

- [ ] Write tests asserting exact identity copy, exact six nav labels/order, no `Studio`/`Go Live` in public nav, and section validation.
- [ ] Run the focused test and verify RED because `src/product.ts` does not exist.
- [ ] Implement the smallest typed product configuration that satisfies the test.
- [ ] Run the focused test and full test suite; expect PASS.
- [ ] Commit.

### Task 2: Add honest public lane destinations

**Files:**
- Create: `src/screens/PublicLaneScreen.tsx`
- Create: `__tests__/PublicLaneScreen.test.tsx`

**Interfaces:**
- Consumes: `PublicSection` from Task 1.
- Produces: `PublicLaneScreen({ section }: { section: Exclude<PublicSection, 'live'> })`.

- [ ] Write rendering tests for each non-Live section asserting its exact lane title and an explicit not-yet-populated message.
- [ ] Run focused test and verify RED.
- [ ] Implement the reusable responsive lane screen using the existing theme.
- [ ] Run focused test and full suite; expect PASS.
- [ ] Commit.

### Task 3: Make the app public-first and move Studio behind account access

**Files:**
- Modify: `App.tsx`
- Create: `__tests__/AppShell.test.tsx`
- Modify: `src/screens/LoginScreen.tsx`
- Modify: `src/screens/DiscoveryFeed.tsx`
- Modify: `src/screens/AccountScreen.tsx`

**Interfaces:**
- Consumes: `productIdentity`, `publicSections`, `PublicLaneScreen`, existing `DiscoveryFeed`, `GoLiveFlow`, `AccountScreen`, and auth context.
- Produces: public-first app shell where public sections work signed out and protected `studio/account/sign-in` surfaces remain explicit.

- [ ] Write shell tests proving signed-out default renders NSCENE + Live browse, six public labels are rendered, and `Studio` is absent for signed-out users.
- [ ] Write authenticated shell test proving Studio/account access exists without joining public nav.
- [ ] Run focused tests and verify RED against current forced-login shell.
- [ ] Refactor `App.tsx` navigation state to separate public sections from protected surfaces.
- [ ] Replace remaining user-facing Tube/HALO copy in the touched screens with NSCENE identity copy.
- [ ] Add Studio entry to authenticated account controls; preserve `GoLiveFlow` as the Studio destination.
- [ ] Run focused tests, full Jest suite, and `npm run typecheck`; expect PASS.
- [ ] Commit.

### Task 4: Preview verification and handoff

**Files:**
- No product-code changes unless verification finds a defect.

**Interfaces:**
- Consumes: branch head from Tasks 1–3.
- Produces: verified preview evidence suitable for review before production promotion/domain attachment.

- [ ] Verify branch diff contains only the NSCENE public-site slice plus its tests/docs.
- [ ] Confirm GitHub CI on the branch head is green; if not, fix failures with a new RED/GREEN cycle.
- [ ] Inspect the Vercel preview deployment for the exact branch head.
- [ ] Confirm no production promotion or `nscene.watch` attachment has occurred yet.
- [ ] Report remaining runtime/backend gates separately from the verified public shell.