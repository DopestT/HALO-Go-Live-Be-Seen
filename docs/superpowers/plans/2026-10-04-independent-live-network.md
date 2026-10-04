# HALO Independent Live Network Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repurpose HALO into an independent Twitch-like live network with a provider-independent live core, durable HALO-owned state, moderation, audience portability, creator monetization, archive/clips, and transparent discovery.

**Architecture:** Preserve the existing Go/PostgreSQL/Redis backend and LiveKit integration, but put provider-specific behavior behind internal interfaces and introduce durable HALO domain records for channels, broadcasts, audience imports, moderation, entitlements, recordings, and discovery. Keep the existing React Native/Expo client as the first client while removing legacy product assumptions incrementally rather than rewriting the entire repository at once.

**Tech Stack:** Go 1.24+, Gin, PostgreSQL 15+, Redis 7+, React Native/Expo/TypeScript, LiveKit, Stripe, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-04-independent-live-network-design.md`

## Global Constraints

- `DopestT/HALO-Go-Live-Be-Seen` is the canonical repository.
- Existing HALO product assumptions are superseded by the independent live-network spec.
- HALO owns canonical application state; media/payment/import providers are replaceable adapters.
- Provider identifiers never become primary HALO domain identifiers.
- Imported audience members are external references and must never become silently-created HALO accounts.
- Initial growth may focus on progressive/public-interest creators, but access and moderation are rule-based rather than ideological loyalty tests.
- No behavioral-advertising dependency, secret paid ranking, fake urgency, hidden bundling, or intentionally difficult cancellation.
- Durable state belongs in PostgreSQL/object storage; Redis is ephemeral coordination/cache state.

## Review Focus

1. Provider outage or malformed provider response must not corrupt canonical broadcast/import state.
2. Duplicate audience imports must deduplicate by creator, provider, and external identity without silently creating users.
3. Unauthorized channel/moderation operations must fail closed and create no partial durable effects.
4. Payment webhooks must be idempotent and reconcile into HALO-owned entitlement records.
5. Stream termination/restart must leave broadcasts and recordings in a recoverable, auditable lifecycle state.

---

### Task 1: Canonical Takeover Metadata and CI Baseline

**Files:**
- Modify: `README.md`
- Modify: `package.json`
- Create: `.github/workflows/verify.yml`
- Test: repository verification workflow

**Interfaces:**
- Consumes: existing root Expo app and `backend/` service.
- Produces: one canonical product description and repeatable verification entry points.

- [ ] Replace stale generic social-networking copy with the independent live-network product definition and canonical architecture links.
- [ ] Keep existing runnable scripts; add explicit `verify`/typecheck scripts only where dependencies already support them.
- [ ] Add CI jobs for root JS tests, backend `go test ./...`, backend build, and static checks that do not require production secrets.
- [ ] Verify CI starts on pull requests and branch pushes.

### Task 2: HALO Domain Schema Foundation

**Files:**
- Create: `backend/migrations/002_live_network_core.sql`
- Create: `backend/internal/platform/models.go`
- Create: `backend/internal/platform/models_test.go`

**Interfaces:**
- Produces: stable UUID-backed domain types for channels, broadcasts, provider sessions, follows, external identities, external audience references, import jobs, moderation/audit records, payments/entitlements, recordings, clips, and action links.

- [ ] Write tests asserting lifecycle/status validation and that provider IDs are metadata rather than canonical IDs.
- [ ] Add an additive migration with foreign keys, uniqueness constraints, timestamps, lifecycle enums/check constraints, and idempotency keys where needed.
- [ ] Ensure duplicate audience references are constrained by `(creator_channel_id, provider, external_user_id)`.
- [ ] Run `go test ./...` and migration syntax checks available in CI.

### Task 3: Streaming Provider Boundary and Broadcast Lifecycle

**Files:**
- Create: `backend/internal/streaming/provider.go`
- Create: `backend/internal/streaming/service.go`
- Create: `backend/internal/streaming/service_test.go`
- Create: `backend/internal/streaming/livekit/adapter.go`

**Interfaces:**
- Produces: `Provider` interface and HALO-owned `BroadcastService` lifecycle methods.
- Provider contract covers channel/session creation, publisher/viewer credentials, playback target, end, viewer count, recording start/stop, and clip request.

- [ ] Write fake-provider tests for create/start/end failure handling and provider-ID isolation.
- [ ] Implement minimal lifecycle orchestration so canonical broadcast state is written independently of provider state.
- [ ] Add LiveKit adapter shell around existing LiveKit integration points; secrets remain environment-only.
- [ ] Verify provider errors do not mutate a broadcast to an impossible state.

### Task 4: Audience Portability Core

**Files:**
- Create: `backend/internal/audience/provider.go`
- Create: `backend/internal/audience/service.go`
- Create: `backend/internal/audience/service_test.go`
- Create: `backend/internal/audience/providers/twitch.go`
- Create: `backend/internal/audience/providers/youtube.go`
- Create: `backend/internal/audience/providers/patreon.go`
- Create: `backend/internal/audience/csv.go`

**Interfaces:**
- Produces: provider-neutral import types, deduplication, claim-and-restore matching, creator migration attribution, and consent-aware CSV parsing.

- [ ] Write tests proving external references never create users implicitly.
- [ ] Write duplicate/import replay tests.
- [ ] Write identity-claim tests that return a suggested follow/restore action requiring explicit consent.
- [ ] Add provider adapter shells that require OAuth/provider tokens but keep provider payloads outside domain models.
- [ ] Add CSV validation for permission/consent flags and reject scraped/no-consent outreach rows.

### Task 5: Moderation and Audit Foundation

**Files:**
- Create: `backend/internal/moderation/service.go`
- Create: `backend/internal/moderation/service_test.go`

**Interfaces:**
- Produces: report, timeout, mute, ban, emergency-stop, appeal-foundation, and append-only audit-event operations.

- [ ] Write permission tests for owner/admin/broadcaster/moderator/viewer roles.
- [ ] Implement fail-closed authorization.
- [ ] Ensure platform-staff and organization/channel-moderator actions are distinguishable in audit data.
- [ ] Ensure emergency stream termination records reason and actor before provider termination is attempted.

### Task 6: Monetization and Entitlement Ledger Boundary

**Files:**
- Create: `backend/internal/entitlements/service.go`
- Create: `backend/internal/entitlements/service_test.go`

**Interfaces:**
- Produces: HALO-owned entitlement reconciliation keyed by processor event idempotency keys.

- [ ] Write duplicate webhook tests.
- [ ] Implement processor-neutral entitlement and payout-record operations.
- [ ] Keep Stripe as an adapter/event source, not the source of truth for access.

### Task 7: Creator/Fan Product Surfaces

**Files:**
- Create or modify React Native screens/components under the canonical `src/` app only.
- Create: audience migration onboarding, creator migration dashboard, live channel surface, and creator studio entry points.
- Test: component/unit tests for migration consent and creator attribution.

**Interfaces:**
- Consumes: `/channels`, `/broadcasts`, `/audience-imports`, `/moderation`, `/subscriptions` APIs.
- Produces: first coherent independent-live-network UX without requiring legacy Adult Mode or unrelated HALO assumptions.

- [ ] Home: Live Now, Following, categories, upcoming streams, transparent recommendation reason.
- [ ] Channel: player, chat, follow/support, schedule, archive, action/source links.
- [ ] Creator Studio: Go Live, OBS setup, moderators, scheduling, audience portability dashboard.
- [ ] Fan migration URL flow: creator attribution, sign-up/sign-in, optional external identity link, explicit one-tap follow/restore consent.

### Task 8: API Wiring and Public-Beta Verification

**Files:**
- Modify: `backend/cmd/api/main.go`
- Create handlers/routes next to each bounded domain package.
- Create: `docs/verification/public-beta-gate.md`

**Interfaces:**
- Produces: `/channels`, `/broadcasts`, `/audience-imports`, `/moderation`, `/subscriptions`, `/recordings`, `/clips`, `/discovery`, and `/actions` route groups.

- [ ] Wire read/write endpoints behind existing JWT middleware where appropriate.
- [ ] Add health/readiness checks for Postgres and Redis without leaking secret values.
- [ ] Run repository CI and CodeQL.
- [ ] Document which beta acceptance criteria are verified in CI, which require staging LiveKit/Stripe/OAuth credentials, and which remain unverified.
- [ ] Do not mark public beta ready until staging backup/restore and real provider integration drills are exercised.

## Execution Order

Tasks 1 and 2 establish the baseline. Tasks 3-6 can proceed in parallel once Task 2 domain identifiers are fixed. Task 7 can proceed in parallel against the API contracts once Tasks 3-6 interfaces are stable. Task 8 integrates and verifies the system.

## Completion Standard

Implementation is complete only when the repository builds in CI, tests pass, provider-specific identifiers remain behind adapters, audience import/claim semantics are covered by tests, moderation/entitlement operations are auditable and idempotent, and the public-beta gate truthfully separates CI-verified behavior from staging/provider-dependent behavior.