# NSCENE Messenger V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a first-party, persistent, one-to-one NSCENE Messenger with durable Postgres state, server-enforced request/block/report policy, TanStack Query synchronization, Redis post-commit events, playback-safe unread signaling, and no Apple Developer/APNs dependency.

**Architecture:** PostgreSQL and the Go API remain authoritative. Add a focused `backend/internal/messaging` package and `004_messenger_v1.sql`, generate typed query code with sqlc while reusing the repository's existing `*sql.DB` backed by pgx/v5 stdlib, publish non-content Redis events only after durable mutations succeed, and expose a typed authenticated client through TanStack Query. Messenger must remain correct with polling alone; Redis/realtime is acceleration, not truth.

**Tech Stack:** Expo 57 / React Native 0.86.3 / React 19.2.3 / TypeScript 6.0.3 / Jest; Go 1.27.2 / Gin / PostgreSQL / pgx v5 stdlib / Redis; `@tanstack/react-query@5.104.3`; `sqlc@v1.31.1`; optional `@shopify/flash-list@2.3.3` only if its compatibility gate passes.

**Spec:** `docs/superpowers/specs/2026-10-19-nscene-messenger-v1-design.md` plus `docs/superpowers/specs/2026-10-19-nscene-messenger-v1-stack-addendum.md`

## Global Constraints

- PostgreSQL is authoritative for conversations, messages, requests, reads, blocks, inbox hiding, and reports.
- Redis cannot determine persistence success or authorization.
- Acting user identity always comes from JWT middleware context key `user_id`; clients never choose sender identity.
- A new direct conversation allows exactly one initial message until the recipient accepts.
- Decline is terminal for V1; unblock restores the prior request state and never creates a replacement thread.
- Message bodies are plain text, normalized, non-empty, maximum 4,000 Unicode characters.
- Report details are maximum 1,000 Unicode characters and use only approved reason codes.
- Baseline per-user limits: 10 conversation creates/hour; 30 message sends/minute; 20 reports/hour; 30 block/unblock actions/hour.
- Messenger notifications never cover, pause, resize, navigate away from, or take focus from active video.
- V1 introduces no APNs, TestFlight, App Store provisioning, native push entitlement, hosted chat SaaS, E2EE claim, presence claim, typing indicator, attachment flow, or group chat.
- Foreground polling remains 10 seconds and pauses when lifecycle support indicates background/unmounted state.
- Every new dependency must preserve clean install, Jest, TypeScript, backend tests, security checks, and Expo web export.

## Review Focus

1. **Authorization bypass:** user A must never read/mutate a conversation between B and C.
2. **Request/block races:** duplicate create, accept/decline, block/unblock, and concurrent sends must preserve one canonical pair and server policy.
3. **False delivery:** UI must not claim persistence when HTTP failed, and Redis failure must not invalidate a successful DB commit.
4. **Playback interruption:** unread changes during playback may add only glow/badge treatment, never modal/overlay/navigation/focus changes.
5. **Pagination/unread drift:** cursor boundaries, hidden threads, and read markers must not double-count or skip messages.

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
- Consumes: existing `users(id)` and existing `*sql.DB` from `internal/database`.
- Produces: generated query methods for canonical pair lookup/create, participants, messages, request status, read state, unread count, inbox hiding, blocks, and reports.

- [ ] **Step 1: Write the failing generated-contract test** that compile-checks the query surface above.
- [ ] **Step 2: Run** `cd backend && go test ./internal/messaging/...` **and verify RED** because the generated package does not exist.
- [ ] **Step 3: Add `004_messenger_v1.sql`** with tables `conversations`, `conversation_participants`, `messages`, `user_blocks`, `moderation_reports`; enforce canonical-pair uniqueness, `low_id < high_id`, valid request statuses, no self-block, approved report target/reasons, length constraints where practical, and indexes for inbox ordering, pagination, unread counts, blocks, and moderation review.
- [ ] **Step 4: Add sqlc config/query files.** Pin `sqlc@v1.31.1`. Generate with `database/sql` so Messenger reuses the current `*sql.DB` pool while pgx/v5 remains the driver; do not create a second pgx pool.
- [ ] **Step 5: Add Makefile `generate` target** using `go run github.com/sqlc-dev/sqlc/cmd/sqlc@v1.31.1 generate`.
- [ ] **Step 6: Run** `cd backend && make generate && go test ./internal/messaging/... && go vet ./...` **and verify PASS**.
- [ ] **Step 7: Commit:** `feat: add messenger persistence schema`.

### Task 2: Implement transactional repository and policy service

**Files:**
- Create: `backend/internal/messaging/types.go`
- Create: `backend/internal/messaging/repository.go`
- Create: `backend/internal/messaging/service.go`
- Create: `backend/internal/messaging/service_test.go`

**Interfaces:**
- Consumes: Task 1 `dbgen.Queries`, `*sql.DB`, actor IDs.
- Produces: `CreateConversation`, `ListConversations`, `GetConversation`, `SendMessage`, `AcceptRequest`, `DeclineRequest`, `MarkRead`, `HideConversation`, `BlockUser`, `UnblockUser`, `CreateReport`, `UnreadCount`.

- [ ] **Step 1: Write failing table-driven service tests** for pair uniqueness, self-message rejection, exactly one pending initial message, accept, decline, send-after-decline, both-direction block enforcement, unblock restoring prior status, nonparticipant access, 4,000-character message boundary, valid report reasons/1,000-character detail, hide isolation, read advancement, unread count, and cursor boundaries.
- [ ] **Step 2: Run** `cd backend && go test ./internal/messaging -run TestService -v` **and verify RED**.
- [ ] **Step 3: Define domain types and stable errors:** `unauthorized`, `forbidden`, `conversation_not_found`, `user_not_found`, `self_message_not_allowed`, `message_request_pending`, `message_request_declined`, `user_blocked`, `message_too_long`, `invalid_message`, `rate_limit_exceeded`, `internal_error`.
- [ ] **Step 4: Implement repository transactions** using `*sql.Tx` + `dbgen.New(tx)` for create+initial-message, accept/decline, send+last-message/unhide, read, block/unblock, and report persistence. A uniqueness conflict must resolve to the existing canonical pair.
- [ ] **Step 5: Implement service policy** in Go; database constraints remain final protection.
- [ ] **Step 6: Run** `cd backend && go test ./internal/messaging -v && go test ./...` **and verify PASS**.
- [ ] **Step 7: Commit:** `feat: enforce messenger policy`.

### Task 3: Add authenticated HTTP handlers and per-user rate limits

**Files:**
- Create: `backend/internal/messaging/handler.go`
- Create: `backend/internal/messaging/handler_test.go`
- Create: `backend/internal/messaging/user_rate_limiter.go`
- Create: `backend/internal/messaging/user_rate_limiter_test.go`
- Modify: `backend/cmd/api/main.go`

**Interfaces:**
- Consumes: Task 2 service through a handler-facing interface so tests can inject a fake; existing JWT middleware sets `user_id`.
- Produces: every `/api/v1/messages/...` endpoint in the spec and stable JSON error responses.

- [ ] **Step 1: Write failing handler tests** for missing/invalid actor context, participant authorization, body/cursor validation, stable HTTP/error mapping, and every endpoint using a fake service.
- [ ] **Step 2: Write failing per-user rate tests** for exactly 10 create/hour, 30 send/minute, 20 report/hour, 30 block+unblock/hour, independent buckets, and rejection on the next attempt.
- [ ] **Step 3: Run** `cd backend && go test ./internal/messaging -run 'TestHandler|TestUserRateLimiter' -v` **and verify RED**.
- [ ] **Step 4: Implement handlers.** Read `user_id` only from Gin context, never request payloads; bound JSON and pagination sizes; never leak SQL details.
- [ ] **Step 5: Implement Messenger-specific authenticated rate buckets.** Keep the existing global IP limiter unchanged.
- [ ] **Step 6: Register `/api/v1/messages` behind `AuthMiddleware(jwtManager)`** in `backend/cmd/api/main.go` using the existing DB connection.
- [ ] **Step 7: Run** `cd backend && go test ./... && go vet ./... && go build ./cmd/api` **and verify PASS**.
- [ ] **Step 8: Commit:** `feat: expose messenger api`.

### Task 4: Add post-commit Redis event publishing

**Files:**
- Create: `backend/internal/messaging/events.go`
- Create: `backend/internal/messaging/events_test.go`
- Modify: `backend/internal/messaging/service.go`
- Modify: `backend/cmd/api/main.go`

**Interfaces:**
- Consumes: successful durable mutations and existing `database.RedisClient`.
- Produces: `EventPublisher.Publish(context.Context, Event) error` for `message.persisted`, `conversation.requested`, `conversation.accepted`, `conversation.declined`, `conversation.read`, `user.blocked`, `user.unblocked`.

- [ ] **Step 1: Write failing event-order tests**: no event on DB failure; DB success remains success if publish fails; payloads contain IDs/state metadata but never plaintext body.
- [ ] **Step 2: Run** `cd backend && go test ./internal/messaging -run TestEvent -v` **and verify RED**.
- [ ] **Step 3: Implement Redis publisher** on namespaced channel `nscene:messenger:events`, only after commit, with bounded body-free failure logging.
- [ ] **Step 4: Inject publisher into service** and retain a no-op/fake publisher for tests/degraded operation.
- [ ] **Step 5: Run messaging tests with a failing fake publisher** and verify durable operations still satisfy the spec.
- [ ] **Step 6: Commit:** `feat: publish messenger state events`.

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
- Consumes: auth token from `AuthContext` and Task 3 API.
- Produces: typed transport plus hooks for inbox, Requests, conversation pages, unread count, and all mutations.

- [ ] **Step 1: Add `@tanstack/react-query@5.104.3` and write failing API tests** for bearer auth, safe error parsing, sender-ID omission, cursor encoding, request bodies, and response validation.
- [ ] **Step 2: Write failing Query tests** for deterministic keys, 10-second foreground refresh, disabled queries without token, targeted invalidation, retained last-good data on transient errors, and no false delivered state after failed sends.
- [ ] **Step 3: Run** `npm run test:ci -- __tests__/messageClient.test.ts __tests__/messageQueries.test.tsx` **and verify RED**.
- [ ] **Step 4: Implement typed transport** using the existing `EXPO_PUBLIC_API_BASE_URL` convention and `Authorization: Bearer <token>`.
- [ ] **Step 5: Implement query keys/hooks/provider.** Use infinite queries for cursor pagination and lifecycle-aware 10-second polling.
- [ ] **Step 6: Mount exactly one QueryClientProvider** at the app root without changing auth semantics.
- [ ] **Step 7: Run** `npm ci --include=dev && npm run test:ci && npm run typecheck && npm run build` **and verify PASS**.
- [ ] **Step 8: Commit:** `feat: add messenger client state layer`.

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
- Produces: authenticated `/messages` and `/messages/:conversationId` routes plus responsive inbox/Requests shell.

- [ ] **Step 1: Extend failing route/app-shell tests.** Authenticated account actions must be `MESSAGES`, `STUDIO`, `ACCOUNT`; `resolveRequestedSection('messages', false)` must return `signin` while existing Studio/Account behavior remains unchanged; `/messages/42` must parse as a dedicated message-detail route; signed-out message-detail navigation must be redirected to `/signin`; invalid/nonpositive IDs must be rejected; public navigation must still contain exactly six lanes.
- [ ] **Step 2: Write failing inbox UI tests** for loading, empty, error/offline, Inbox, Requests, unread badges, pending indicators, no fabricated presence, and wide two-pane vs compact single-pane structure.
- [ ] **Step 3: Run** `npm run test:ci -- __tests__/AppShell.test.ts __tests__/PublicNavigator.test.tsx __tests__/MessagesScreen.test.tsx` **and verify RED**.
- [ ] **Step 4: Implement route model.** Add `messages` to `ProtectedSection`; parse `/messages` as `{kind:'protected', section:'messages'}`; add `{kind:'message', id:number}` to `PublicAppRoute`; map it to `/messages/:id`; add an auth guard in `App.tsx` that sends signed-out detail access to `{kind:'protected', section:'signin'}`.
- [ ] **Step 5: Implement account/header entry** with a compact authenticated message control/unread badge while preserving the six public destinations and current Create behavior.
- [ ] **Step 6: Implement inbox/Requests UI** with current theme/accessibility patterns and no fake activity.
- [ ] **Step 7: Run focused tests plus** `npm run typecheck` **and verify PASS**.
- [ ] **Step 8: Commit:** `feat: add messenger inbox navigation`.

### Task 7: Add conversation UI, request/moderation actions, and playback-safe unread signal

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
- Create/Modify: `__tests__/WatchScreen.test.tsx`

**Interfaces:**
- Consumes: Task 5 conversation/mutation hooks and Task 6 routes.
- Produces: accepted/pending/declined/blocked conversation UI and non-obstructive player glow/badge behavior.

- [ ] **Step 1: Write failing conversation tests** for chronological rendering, pending/declined/blocked composer locks, accept/decline, send-in-flight, failure+retry without duplicate display, block/unblock, report validation, hide-from-inbox, read advancement only after successful load, and older-message pagination.
- [ ] **Step 2: Write failing playback tests.** Unread state may add only a player-wrapper edge signal/badge; it must not add a modal, message preview overlay, navigation action, playback pause behavior, or focus-stealing control.
- [ ] **Step 3: Run** `npm run test:ci -- __tests__/ConversationScreen.test.tsx __tests__/WatchScreen.test.tsx` **and verify RED**.
- [ ] **Step 4: Implement conversation components** using text rendering only and server-confirmed state; no per-message seen receipts.
- [ ] **Step 5: Implement playback-safe signal** through a small prop/component boundary into `WatchScreen`; apply subtle glow to `playerWrap` and a badge outside playback controls, with no message content over media.
- [ ] **Step 6: Run focused tests, full Jest, and TypeScript** and verify PASS.
- [ ] **Step 7: Commit:** `feat: complete messenger conversation flow`.

### Task 8: Run FlashList gate and whole-stack verification

**Files:**
- Conditional Modify: `package.json`
- Conditional Modify: `package-lock.json`
- Conditional Modify: `src/screens/messages/MessagesScreen.tsx`
- Conditional Modify: `src/screens/messages/ConversationScreen.tsx`
- Create/Modify: `__tests__/MessengerListRenderer.test.tsx`
- Modify only if required for deterministic verification: `.github/workflows/verify.yml`

**Interfaces:**
- Consumes: completed Messenger V1.
- Produces: either verified FlashList 2.3.3 adoption or explicitly verified React Native list fallback, plus whole-repo green evidence.

- [ ] **Step 1: Add a renderer contract test** for stable keys, pagination append order, unread rows, and message order independent of renderer.
- [ ] **Step 2: Try `@shopify/flash-list@2.3.3` on the implementation branch only.** Because v2 requires RN new architecture, explicitly verify the current Expo/RN configuration supports it.
- [ ] **Step 3: Run clean install, focused list tests, full Jest, TypeScript, Expo web export, and security checks.** If any compatibility gate fails, remove FlashList and retain React Native list primitives; do not delay Messenger V1.
- [ ] **Step 4: Run backend verification:** `cd backend && go test ./... && go vet ./... && go build ./cmd/api`.
- [ ] **Step 5: Run client verification:** `npm ci --include=dev && npm run test:ci && npm run typecheck && npm run build`.
- [ ] **Step 6: Confirm forbidden dependencies/claims are absent:** no APNs/native push config, Centrifugo requirement, SQLite requirement, chat SaaS, E2EE/presence/delivery claims, or plaintext message bodies in default production logs/events.
- [ ] **Step 7: Commit** either `feat: optimize messenger lists with flashlist` or `test: verify messenger list fallback` according to the gate.
- [ ] **Step 8: Prepare PR evidence** separating backend persistence/policy, client flows, Redis degraded behavior, FlashList adopted/rejected evidence, Apple Developer/APNs not required, and Centrifugo/SQLite still follow-on only.

## Self-Review Result

- Spec coverage: all V1 persistence, request, block, report, read/unread, hide, rate-limit, playback-safety, no-Apple-account, Redis, TanStack Query, sqlc, and FlashList-gate requirements map to tasks above.
- Type/interface consistency: handler is explicitly interface-backed for tests; route types distinguish inbox protected section from message-detail route; `*sql.DB` remains the only Postgres pool.
- Scope: Centrifugo, Expo SQLite, native push, attachments, groups, presence, E2EE, and Creator Studio remain outside this implementation plan.
