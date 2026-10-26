# NSCENE Public Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a truthful, URL-addressable public NSCENE search experience over the real video and creator data already exposed by the product.

**Architecture:** Extend the existing browser route contract with `/search?q=...`, then add a public `SearchScreen` that queries the existing bounded Live, Uploads, and Creators APIs in parallel and filters only returned records. This first search slice deliberately does not fabricate Clips, Shows, or Communities results and does not add a second search datastore; server-side indexing/ranking remains a later scale step.

**Tech Stack:** Expo 57, React Native Web, TypeScript 6, Jest 29, React Native Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-15-nscene-cross-platform-product-design.md`

## Global Constraints

- Public identity remains NSCENE — `See It. Share It. Live It.`
- The six locked public content destinations remain exactly `LIVE | UPLOADS | CLIPS | SHOWS | CREATORS | COMMUNITIES`; Search is a utility, not a seventh content lane.
- Browsing/search remains public and signed-out capable.
- Search results may only represent real records returned by current APIs.
- Unsupported Clips, Shows, and Communities must not be synthesized into search results.
- Keep the current bounded API limits; do not imply exhaustive/global indexing in this slice.

## Review Focus

- `/search?q=hello%20world` round-trips without losing or double-decoding the query.
- Blank search does not fire network requests or show fake suggestions.
- API errors show an unavailable state instead of local mock data.
- Duplicate video records from Live/Uploads are deduplicated by ID.
- Search remains outside the six-item primary content navigation.

---

### Task 1: Search route contract

**Files:**
- Modify: `src/navigation/PublicNavigator.tsx`
- Modify: `__tests__/PublicNavigator.test.tsx`

**Interfaces:**
- Produces: `{ kind: 'search'; query: string }` public utility route and stable `/search?q=` serialization.

- [ ] Add failing tests for parsing, encoding, blank query, and route generation.
- [ ] Run focused route tests and verify RED.
- [ ] Implement search route parsing/history support without changing the six public lanes.
- [ ] Re-run focused tests and typecheck; verify GREEN.

### Task 2: Real-data Search screen and header entry

**Files:**
- Create: `src/screens/SearchScreen.tsx`
- Create: `__tests__/SearchScreen.test.tsx`
- Modify: `App.tsx`

**Interfaces:**
- Consumes: `listVideos({ live: true|false, limit: 50 })`, `listCreators({ limit: 50 })`.
- Produces: public search form, returned-video results, returned-creator results, empty/error states, and navigation to watch/creator detail.

- [ ] Add failing tests for blank state, matching real records, deduplication, no-result state, API error state, and open-result callbacks.
- [ ] Run focused tests and verify RED.
- [ ] Implement the minimal Search screen and a header Search utility action outside primary navigation.
- [ ] Run focused tests, full Jest, typecheck, and web export.

### Task 3: CI evidence

- [ ] Open a PR against `main` as draft during TDD.
- [ ] Verify RED then GREEN CI evidence on the branch.
- [ ] Keep any server-side full-text/indexed search work as a separate scale follow-up rather than silently expanding this slice.
