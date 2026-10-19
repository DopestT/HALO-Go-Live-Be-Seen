# NSCENE Messenger V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a first-party, persistent, one-to-one NSCENE Messenger with durable Postgres state, server-enforced request/block/report policy, TanStack Query client synchronization, Redis post-commit events, playback-safe unread signaling, and no Apple Developer/APNs dependency.

**Architecture:** Keep PostgreSQL and the Go API authoritative. Add a focused `backend/internal/messaging` package and a `004_messenger_v1.sql` migration, generate typed query code with sqlc while reusing the repository's existing `*sql.DB` backed by the pgx/v5 stdlib driver, publish non-content Redis events only after durable mutations succeed, and expose a typed authenticated client consumed through TanStack Query. Messenger remains correct with polling alone; Redis/realtime is acceleration, not truth.

**Tech Stack:** Expo 57 / React Native 0.86.3 / React 19.2.3 / TypeScript 6.0.3 / Jest; Go 1.27.2 / Gin / PostgreSQL / pgx v5 stdlib / Redis; `@tanstack/react-query@5.104.3`; `sqlc@v1.31.1`; optional `@shopify/flash-list@2.3.3` only if the compatibility gate passes.

**Spec:** `docs/superpowers/specs/2026-10-19-nscene-messenger-v1-design.md` plus `docs/superpowers/specs/2026-10-19-nscene-messenger-v1-stack-addendum.md`

## Global Constraints

- PostgreSQL is the authoritative source for conversations, messages, requests, reads, blocks, inbox hiding, and reports.
- Redis may accelerate/invalidate state but cannot determine persistence success or authorization.
- Acting user identity always comes from the existing JWT middleware context key `user_id`; clients never choose sender identity.
- New direct conversations allow exactly one initial message until the recipient accepts.
- Decline is terminal for V1; unblock restores prior request state and does not create a new thread.
- Message bodies are plain text, normalized, non-empty, maximum 4,000 Unicode characters.
- Report details are maximum 1,000 Unicode characters and use only the approved reason codes.
- Baseline per-user limits: 10 conversation creates/hour; 30 message sends/minute; 20 reports/hour; 30 block/unblock actions/hour.
- Messenger notifications never cover, pause, resize, navigate away from, or take focus from active video.
- V1 introduces no APNs, TestFlight, App Store provisioning, native push entitlement, hosted chat SaaS, E2EE claim, presence claim, typing indicator, attachment flow, or group chat.
- Foreground polling remains 10 seconds and pauses when lifecycle support indicates background/unmounted state.
- Every new dependency must preserve clean install, Jest, TypeScript, backend tests, security checks, and Expo web export.

## Review Focus

1. **Authorization bypass:** a valid JWT for user A must never read/mutate a conversation between B and C; cover in service and handler tests.
2. **Request/block races:** duplicate create, accept/decline, block/unblock, and simultaneous sends must preserve one canonical pair and server policy; cover with transaction/service tests.
3. **False delivery:** UI must not show delivered/persisted state when the HTTP mutation failed or Redis publication failed; cover API/query tests.
4. **Playback interruption:** unread changes during playback must only add glow/badge treatment and must not create modal/overlay/navigation side effects; cover WatchScreen tests.
5. **Pagination/unread drift:** cursor boundaries, hidden threads, and read markers must not double-count or skip messages; cover query/service tests.

---

### Task 1: Add Messenger schema and sqlc contract

**Files:**
- Create: `backend/migrations/004_messenger_v1.sql`
- Create: `backend/sqlc.yaml`
- Create: `backend/internal/messaging/sql/queries.sql`
- Create generated package: `backend/internal/messaging/dbgen/`
- Modify: `backend/Makefile`
- Test: `backend/internal/messaging/dbgen_contract_test.go`

**Interfaces:**
- Consumes: existing `users(id)` table and existing `*sql.DB` from `internal/database`.
- Produces: generated `dbgen.Queries`, row/parameter types, and transaction-compatible query methods used by Task 2.

- [ ] **Step 1: Write the failing generated-contract test**

Create `dbgen_contract_test.go` that compile-checks the generated query surface needed by Messenger: canonical-pair lookup/create, participant insert/list, message insert/list, request-status update, read-state update, unread count, inbox hide/unhide, block create/delete/check, and report insert.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `cd backend && go test ./internal/messaging/...`

Expected: fail because the Messenger schema/generated package does not exist.

- [ ] **Step 3: Add `004_messenger_v1.sql` with all approved constraints and indexes**

Create tables `conversations`, `conversation_participants`, `messages`, `user_blocks`, and `moderation_reports`; enforce canonical pair uniqueness, `low_id < high_id`, request-status checks, block self-check, report target/reason checks, message/report length constraints where practical, and indexes for inbox ordering, conversation pagination, unread queries, block checks, and report review.

- [ ] **Step 4: Add sqlc configuration and queries**

Pin sqlc tool usage to `v1.31.1`. Generate Go using `database/sql` because the existing runtime pool is `*sql.DB` using pgx/v5's stdlib driver; do not add a second pgx pool. Place generated code under `backend/internal/messaging/dbgen` and keep policy outside generated SQL.

- [ ] **Step 5: Add Makefile generation command**

Add `sqlc`/`generate` target using `go run github.com/sqlc-dev/sqlc/cmd/sqlc@v1.31.1 generate` from `backend/`.

- [ ] **Step 6: Generate and verify**

Run:

`cd backend && make generate && go test ./internal/messaging/... && go vet ./...`

Expected: PASS.

- [ ] **Step 7: Commit**

`git add backend/migrations/004_messenger_v1.sql backend/sqlc.yaml backend/internal/messaging backend/Makefile && git commit -m "feat: add messenger persistence schema"`

### Task 2: Implement transactional Messenger repository and policy service

**Files:**
- Create: `backend/internal/messaging/types.go`
- Create: `backend/internal/messaging/repository.go`
- Create: `backend/internal/messaging/service.go`
- Create: `backend/internal/messaging/service_test.go`

**Interfaces:**
- Consumes: `dbgen.Queries`, `*sql.DB`, authenticated actor IDs.
- Produces: `Service` methods `CreateConversation`, `ListConversations`, `GetConversation`, `SendMessage`, `AcceptRequest`, `DeclineRequest`, `MarkRead`, `HideConversation`, `BlockUser`, `UnblockUser`, `CreateReport`, `UnreadCount`.

- [ ] **Step 1: Write failing table-driven service tests**

Cover canonical pair uniqueness, self-message rejection, one pending initial message, accept, decline, send-after-decline rejection, both-direction block enforcement, unblock restoring prior status, nonparticipant access rejection, message/report length limits, valid report reasons, hide isolation, read advancement, unread count, and cursor boundaries.

- [ ] **Step 2: Run tests and verify RED**

Run: `cd backend && go test ./internal/messaging -run TestService -v`

Expected: fail because service/repository behavior is absent.

- [ ] **Step 3: Define domain types and stable errors**

Implement approved statuses and public error sentinels/codes: `unauthorized`, `forbidden`, `conversation_not_found`, `user_not_found`, `self_message_not_allowed`, `message_request_pending`, `message_request_declined`, `user_blocked`, `message_too_long`, `invalid_message`, `rate_limit_exceeded`, `internal_error`.

- [ ] **Step 4: Implement repository transactions**

Use `*sql.Tx` plus `dbgen.New(tx)` for create+initial-message, accept/decline, send+last-message/unhide updates, read updates, block/unblock, and report persistence. Database uniqueness violations for canonical pairs must resolve to the existing pair rather than create duplicates.

- [ ] **Step 5: Implement service policy**

Normalize text, enforce actor/participant checks and request/block rules in Go before mutations, while retaining database constraints as final protection.

- [ ] **Step 6: Run focused and package tests**

Run: `cd backend && go test ./internal/messaging -v && go test ./...`

Expected: PASS.

- [ ] **Step 7: Commit**

`git add backend/internal/messaging && git commit -m "feat: enforce messenger policy"`

### Task 3: Add authenticated HTTP handlers and per-user rate limits

**Files:**
- Create: `backend/internal/messaging/handler.go`
- Create: `backend/internal/messaging/handler_test.go`
- Create: `backend/internal/messaging/user_rate_limiter.go`
- Create: `backend/internal/messaging/user_rate_limiter_test.go`
- Modify: `backend/cmd/api/main.go`

**Interfaces:**
- Consumes: Task 2 `Service`; existing Gin JWT middleware sets `user_id`.
- Produces: all `/api/v1/messages/...` endpoints in the spec and stable JSON error responses.

- [ ] **Step 1: Write failing handler tests**

Exercise missing/invalid actor context, participant authorization, request validation, stable HTTP/error mapping, pagination parameters, and all endpoint routes using a fake service.

- [ ] **Step 2: Write failing rate-limit tests**

Assert per-user windows exactly: create 10/hour, send 30/minute, report 20/hour, block/unblock 30/hour, with independent buckets and `rate_limit_exceeded` on the next attempt.

- [ ] **Step 3: Run tests and verify RED**

Run: `cd backend && go test ./internal/messaging -run 'TestHandler|TestUserRateLimiter' -v`

Expected: fail because handlers/limits do not exist.

- [ ] **Step 4: Implement handlers and actor extraction**

Parse `user_id` from Gin context only; never accept sender IDs from request bodies. Bound cursor/page sizes and JSON body sizes. Map service errors without leaking SQL details.

- [ ] **Step 5: Implement per-user limiters**

Keep the existing global IP limiter unchanged; add Messenger-specific authenticated user buckets inside the messaging package so product limits are not conflated with global API protection.

- [ ] **Step 6: Register protected routes**

In `backend/cmd/api/main.go`, construct Messenger repository/service/handler from the existing Postgres connection and add a `/api/v1/messages` group behind `AuthMiddleware(jwtManager)`.

- [ ] **Step 7: Verify backend**

Run: `cd backend && go test ./... && go vet ./... && go build ./cmd/api`

Expected: PASS.

- [ ] **Step 8: Commit**

`git add backend/internal/messaging backend/cmd/api/main.go && git commit -m "feat: expose messenger api"`

### Task 4: Add post-commit Redis event publishing

**Files:**
- Create: `backend/internal/messaging/events.go`
- Create: `backend/internal/messaging/events_test.go`
- Modify: `backend/internal/messaging/service.go`
- Modify: `backend/cmd/api/main.go`

**Interfaces:**
- Consumes: successful durable service mutations; existing `database.RedisClient`.
- Produces: `EventPublisher.Publish(ctx, Event) error` with event types from the stack addendum.

- [ ] **Step 1: Write failing event-order tests**

Assert no event publishes when persistence fails; successful persistence returns success even if publisher fails; payloads contain IDs/state metadata but not message body; each approved transition emits the expected event type.

- [ ] **Step 2: Run tests and verify RED**

Run: `cd backend && go test ./internal/messaging -run TestEvent -v`

- [ ] **Step 3: Implement event abstraction and Redis publisher**

Use a namespaced channel such as `nscene:messenger:events`. Publish only after transaction commit. Log publisher failures without plaintext message content.

- [ ] **Step 4: Inject publisher into service**

Keep a no-op publisher available for tests/degraded operation; wire the Redis publisher in `main.go` using the already-created client.

- [ ] **Step 5: Verify degraded correctness**

Run all messaging tests with a failing fake publisher and verify durable operations still succeed as specified.

- [ ] **Step 6: Commit**

`git add backend/internal/messaging backend/cmd/api/main.go && git commit -m "feat: publish messenger state events"`

### Task 5: Add typed client API and TanStack Query synchronization

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/api/messageClient.ts`
- Create: `src/messages/queryKeys.ts`
- Create: `src/messages/queries.ts`
- Create: `src/messages/types.ts`
- Create: `src/messages/QueryProvider.tsx`
- Modify: `App.tsx`
- Test: `__tests__/messageClient.test.ts`
- Test: `__tests__/messageQueries.test.tsx`

**Interfaces:**
- Consumes: existing auth token from `AuthContext`; Task 3 HTTP API.
- Produces: typed API calls plus hooks for inbox, requests, conversation pages, unread count, and all mutations.

- [ ] **Step 1: Add `@tanstack/react-query@5.104.3` and write failing API tests**

Test bearer auth, safe error parsing, sender-ID omission, cursor encoding, request bodies, and response validation.

- [ ] **Step 2: Write failing Query tests**

Assert deterministic keys, 10-second foreground refresh, disabled queries without a token, targeted invalidation after mutations, retained last good data on transient errors, and no false delivered state after failed sends.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npm run test:ci -- __tests__/messageClient.test.ts __tests__/messageQueries.test.tsx`

- [ ] **Step 4: Implement typed client**

Use the existing `EXPO_PUBLIC_API_BASE_URL` convention and `Authorization: Bearer <token>` header. Keep transport functions independent of React.

- [ ] **Step 5: Implement query keys/hooks/provider**

Centralize keys by user/bucket/conversation. Use infinite queries for cursor-paginated lists/history, mutations for writes, and app/browser lifecycle integration to pause foreground polling where supported.

- [ ] **Step 6: Mount one QueryClientProvider at app root**

Wrap inside/alongside the existing `AuthProvider` without changing auth semantics.

- [ ] **Step 7: Verify client dependency safety**

Run: `npm ci --include=dev && npm run test:ci && npm run typecheck && npm run build`

Expected: PASS.

- [ ] **Step 8: Commit**

`git add package.json package-lock.json src/api/messageClient.ts src/messages App.tsx __tests__ && git commit -m "feat: add messenger client state layer"`

### Task 6: Add Messenger routing, account entry, inbox and Requests UI

**Files:**
- Modify: `src/appShell.ts`
- Modify: `src/navigation/PublicNavigator.tsx`
- Modify: `App.tsx`
- Create: `src/screens/messages/MessagesScreen.tsx`
- Create: `src/components/messages/ThreadRow.tsx`
- Create: `src/components/messages/InboxFilters.tsx`
- Test: `__tests__/AppShell.test.ts`
- Test: `__tests__/PublicNavigator.test.tsx`
- Test: `__tests__/MessagesScreen.test.tsx`

**Interfaces:**
- Consumes: Task 5 query hooks.
- Produces: authenticated `/messages` and `/messages/:conversationId` navigation plus inbox/Requests responsive shell.

- [ ] **Step 1: Extend failing routing/app-shell tests**

Assert authenticated account actions become `MESSAGES`, `STUDIO`, `ACCOUNT`; signed-out `/messages` and `/messages/42` resolve through the protected-auth gate; thread route IDs reject nonpositive/non-numeric values; public navigation still contains exactly six lanes.

- [ ] **Step 2: Write failing inbox UI tests**

Cover loading, empty, error/offline, inbox, Requests, unread badges, pending indicators, no fabricated presence, and wide two-pane vs compact single-pane structure.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npm run test:ci -- __tests__/AppShell.test.ts __tests__/PublicNavigator.test.tsx __tests__/MessagesScreen.test.tsx`

- [ ] **Step 4: Implement route model**

Add `messages` as an authenticated protected section and add a dedicated `message` detail route rather than treating it as a public lane.

- [ ] **Step 5: Implement account/header entry**

Add a compact authenticated message control/unread badge while preserving six public nav destinations and current Create behavior.

- [ ] **Step 6: Implement inbox/Requests UI**

Use existing theme tokens and accessibility patterns. Do not introduce presence indicators or fake data.

- [ ] **Step 7: Verify**

Run focused tests, then `npm run typecheck`.

- [ ] **Step 8: Commit**

`git add src/appShell.ts src/navigation/PublicNavigator.tsx App.tsx src/screens/messages src/components/messages __tests__ && git commit -m "feat: add messenger inbox navigation"`

### Task 7: Add conversation UI, requests, moderation actions, and playback-safe unread signal

**Files:**
- Create: `src/screens/messages/ConversationScreen.tsx`
- Create: `src/components/messages/MessageBubble.tsx`
- Create: `src/components/messages/MessageComposer.tsx`
- Create: `src/components/messages/RequestActions.tsx`
- Create: `src/components/messages/ConversationMenu.tsx`
- Create: `src/components/messages/UnreadSignal.tsx`
- Modify: `src/screens/WatchScreen.tsx`
- Modify: `App.tsx`
- Test: `__tests__/ConversationScreen.test.tsx`
- Test: `__tests__/WatchScreen.test.tsx`

**Interfaces:**
- Consumes: Task 5 conversation/mutation hooks and Task 6 routes.
- Produces: accepted/pending/declined/blocked conversation experience and unobtrusive player glow/badge behavior.

- [ ] **Step 1: Write failing conversation tests**

Cover chronological rendering, composer disabled while pending/declined/blocked, accept/decline actions, send-in-flight state, failed-send retry without duplicate display, block/unblock, report reason validation, hide-from-inbox, read advancement only after successful load, and older-message pagination.

- [ ] **Step 2: Write failing playback tests**

Update `WatchScreenView` tests to assert unread state adds only a player-wrapper edge signal/badge and does not add a modal, message preview overlay, navigation action, playback pause prop, or focus-stealing control.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npm run test:ci -- __tests__/ConversationScreen.test.tsx __tests__/WatchScreen.test.tsx`

- [ ] **Step 4: Implement conversation components**

Use plain-text rendering only. Keep server-confirmed mutation state authoritative. Do not show per-message seen receipts.

- [ ] **Step 5: Implement playback-safe unread signaling**

Feed unread-count state into the active watch surface through a small prop/component boundary. Apply a subtle border/glow to `playerWrap` plus a non-obstructive badge outside controls; do not place message content over media.

- [ ] **Step 6: Verify UI and accessibility**

Run focused tests, full Jest, and TypeScript.

- [ ] **Step 7: Commit**

`git add src/screens/messages src/components/messages src/screens/WatchScreen.tsx App.tsx __tests__ && git commit -m "feat: complete messenger conversation flow"`

### Task 8: Run FlashList gate and final verification

**Files:**
- Conditional Modify: `package.json`
- Conditional Modify: `package-lock.json`
- Conditional Modify: `src/screens/messages/MessagesScreen.tsx`
- Conditional Modify: `src/screens/messages/ConversationScreen.tsx`
- Create/Modify: `__tests__/MessengerListRenderer.test.tsx`
- Modify if needed: `.github/workflows/verify.yml`

**Interfaces:**
- Consumes: complete Messenger V1.
- Produces: either verified FlashList 2.3.3 adoption or an explicitly verified FlatList/ScrollView fallback, plus whole-repo green status.

- [ ] **Step 1: Add a list-renderer contract test**

Assert inbox/history rendering preserves stable keys, pagination append order, unread rows, and message order independent of renderer choice.

- [ ] **Step 2: Try `@shopify/flash-list@2.3.3` on the implementation branch only**

Run clean install, focused list tests, full Jest, TypeScript, Expo web export, and existing security checks. Because FlashList v2 requires React Native's new architecture, explicitly confirm the current Expo/RN configuration satisfies that requirement rather than assuming it.

- [ ] **Step 3: Keep or revert based on the gate**

If every gate is green, use FlashList for inbox/history. If any compatibility gate fails, remove the dependency and retain React Native list primitives; do not delay Messenger V1.

- [ ] **Step 4: Run complete backend verification**

Run: `cd backend && go test ./... && go vet ./... && go build ./cmd/api`

Expected: PASS.

- [ ] **Step 5: Run complete client verification**

Run: `npm ci --include=dev && npm run test:ci && npm run typecheck && npm run build`

Expected: PASS.

- [ ] **Step 6: Verify no forbidden dependency or claim slipped in**

Confirm no APNs/native push config, no Centrifugo requirement, no SQLite requirement, no chat SaaS, no E2EE/presence/delivery claims, and no plaintext message bodies in default production logs/events.

- [ ] **Step 7: Commit final compatibility result**

Commit either `feat: optimize messenger lists with flashlist` or `test: verify messenger list fallback`, depending on the gate.

- [ ] **Step 8: Prepare PR evidence**

PR description must separate: backend persistence/policy verified; client flows verified; Redis degraded behavior verified; FlashList adopted or rejected with evidence; Apple Developer/APNs explicitly not required; Centrifugo/SQLite still follow-on only.
