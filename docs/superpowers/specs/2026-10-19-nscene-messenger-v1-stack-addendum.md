# NSCENE Messenger V1 Stack Addendum

**Status:** Normative companion to the approved Messenger V1 design; ready for written review  
**Date:** 2026-10-19  
**Product:** NSCENE  
**Applies to:** `docs/superpowers/specs/2026-10-19-nscene-messenger-v1-design.md`

## 1. Purpose

This addendum locks the implementation technology choices approved after reviewing current open-source options. It supplements the Messenger V1 design and narrows implementation decisions without changing its product behavior, authorization rules, persistence model, safety rules, or Apple-developer-account independence.

When this addendum conflicts with a technology-choice detail in the base Messenger V1 design, this addendum controls. Product and policy behavior in the base design remains authoritative.

## 2. Locked Architecture

Messenger V1 uses the following ownership model:

- **PostgreSQL is the authoritative system of record** for conversations, participants, messages, read state, message requests, blocks, inbox hiding, and moderation reports.
- **The Go API is the sole policy authority** for authentication, participant authorization, request-state transitions, block enforcement, message validation, rate limits, and durable mutation success.
- **Redis is an acceleration and event layer, never the source of truth.** A Redis failure must not lose a persisted message or change authorization semantics.
- **The React Native / Expo client treats server-confirmed state as authoritative** and must not claim delivery, acceptance, decline, read state, block state, or report persistence before the server confirms it.

## 3. Client Data Layer — TanStack Query

Messenger V1 will use `@tanstack/react-query` as the client data-synchronization layer.

It owns:

- inbox queries;
- Requests queries;
- conversation pagination;
- unread-count queries;
- send/accept/decline/block/unblock/read/hide/report mutations;
- retry/error state;
- cache invalidation and targeted cache updates;
- 10-second foreground refresh behavior required by the base spec.

Rules:

- query keys must be centralized and deterministic;
- mutations may show a local `sending` state, but a message is not `delivered` until the API confirms persistence;
- failed mutations remain retryable without creating duplicate user-visible messages;
- query polling pauses when the relevant app/browser lifecycle is backgrounded where supported;
- data needed by active playback notifications must be exposed through a small unread-state boundary rather than importing Messenger screens into the player.

No second client caching/state library is introduced solely for Messenger V1.

## 4. Message Rendering — FlashList Compatibility Gate

`@shopify/flash-list` is the preferred list renderer for inbox and long conversation histories because Messenger can become list-heavy.

It is not a hard dependency until the existing Expo 57 / React Native 0.86.x project passes a compatibility check with the exact dependency set used by the repository.

Acceptance for adopting FlashList:

- clean install succeeds with the repository's committed npm configuration;
- Jest/client tests remain green;
- TypeScript remains green;
- Expo web export remains green;
- representative inbox and conversation rendering works on the currently available test lanes.

If any gate fails, V1 uses the existing React Native list primitives without changing the Messenger API or state architecture. This fallback is not a product-scope reduction.

## 5. Go Data Access — sqlc over pgx

Messenger V1 will add `sqlc` for Messenger database queries and generated Go types, targeting the repository's existing `pgx/v5` stack.

The messaging package must keep SQL in focused query files and generate typed access methods for at least:

- create/find canonical direct conversation;
- create/list participants;
- insert/list messages with cursor pagination;
- fetch conversation only for an authorized participant;
- update request status;
- update/read `last_read_message_id`;
- compute unread count;
- set/clear per-participant inbox hiding;
- create/delete/check user blocks;
- persist moderation reports.

Rules:

- generated sqlc code is not hand-edited;
- service/policy code remains separate from generated query code;
- authorization and request-state policy does not live only in SQL;
- database constraints remain the final protection for canonical pair uniqueness and relational integrity;
- existing `pgx/v5` remains the PostgreSQL driver; do not introduce a second ORM/database abstraction for Messenger V1.

## 6. Redis Event Boundary

The repository already contains Redis infrastructure. Messenger V1 will add a small internal event-publisher interface after durable PostgreSQL mutation succeeds.

Required event classes:

- `message.persisted`
- `conversation.requested`
- `conversation.accepted`
- `conversation.declined`
- `conversation.read`
- `user.blocked`
- `user.unblocked`

Event payloads contain identifiers and state-transition metadata required to invalidate/refetch client-visible state. They must not include plaintext message bodies by default.

Rules:

- PostgreSQL commit happens before event publication;
- event publication failure does not roll back an already-valid persisted message;
- the API response remains truthful about database persistence even if the acceleration/event layer is temporarily unavailable;
- failures are observable through bounded operational logging/metrics without logging message contents;
- V1 correctness must still work through the 10-second request/response refresh path if Redis delivery is unavailable.

Redis Pub/Sub or another existing Redis primitive may implement the first publisher, but business logic depends only on the internal event interface.

## 7. Realtime Adapter Boundary

Full realtime transport is deliberately separated from durable messaging.

The server-side boundary must make it possible to attach a realtime consumer later without rewriting message persistence or policy code.

The preferred later realtime server is **Centrifugo**, self-hosted by NSCENE, because it can consume server-side events and provide WebSocket/SSE-style delivery while keeping PostgreSQL authoritative.

Centrifugo is **not required to complete Messenger V1**.

V1 must not:

- require Centrifugo to send or read messages;
- make realtime delivery equivalent to persistence;
- expose a realtime event directly from untrusted client input;
- put authorization decisions inside the realtime transport that differ from the Go API's policy model.

A later realtime slice must preserve the same API/persistence contracts and must add origin/authentication/payload/rate-limit tests before production enablement.

## 8. Offline Native Cache Boundary

`expo-sqlite` is reserved as the preferred later native offline-cache layer for recent conversations, messages, and drafts.

It is not part of the authoritative V1 state and is not required for V1 acceptance.

Any later SQLite cache must:

- be rebuildable from the server;
- never override server block/request/read policy;
- distinguish unsent drafts from persisted messages;
- avoid turning cached content into a claim of successful delivery;
- preserve the web client's ability to operate without SQLite.

## 9. Explicit Non-Choices

Messenger V1 will not use:

- a hosted chat SaaS as the authoritative message platform;
- a second database alongside PostgreSQL for message truth;
- Gifted Chat or another full chat UI framework as the product shell;
- a new ORM in place of pgx/sqlc;
- APNs as a prerequisite for in-app messaging;
- end-to-end-encryption libraries or claims in V1;
- client-only moderation, block, or request state.

Open-source chat UI projects may be used as implementation references, but NSCENE owns its UI and interaction model.

## 10. Dependency Safety Gate

Every new dependency introduced by Messenger must pass the repository's existing clean-install, test, typecheck, web-export, and security-policy checks before it is accepted.

Add dependencies one architectural layer at a time so a failure is attributable:

1. TanStack Query;
2. sqlc tool/config plus generated Messenger query layer;
3. FlashList only after its compatibility gate passes.

Redis/pgx are already present in the backend and should be reused rather than duplicated.

No dependency change may be justified only by convenience if the same capability is already present in the repository.

## 11. Acceptance Additions

In addition to the base Messenger V1 acceptance criteria:

- PostgreSQL remains authoritative when Redis is unavailable;
- TanStack Query drives Messenger server-state synchronization and the 10-second foreground refresh path;
- sqlc-generated Messenger queries compile against the existing pgx stack and are covered through service/repository tests;
- event publication occurs only after durable state mutation succeeds;
- event payloads do not include plaintext message bodies by default;
- Messenger remains usable without Centrifugo, SQLite offline cache, APNs, or Apple Developer account completion;
- adding Centrifugo later does not require changing the durable conversation/message schema or public Messenger API semantics;
- FlashList is used only if the compatibility gate passes; otherwise V1 ships with existing list primitives.

## 12. Implementation Order Impact

The implementation plan should now sequence Messenger as:

1. schema + sqlc query contract;
2. Go repository/service policy + tests;
3. authenticated HTTP endpoints + rate limits;
4. post-commit Redis event boundary;
5. typed client API + TanStack Query provider/query keys/hooks;
6. routes, inbox, Requests, conversation UI, and playback-safe unread state;
7. FlashList compatibility gate and adoption only if green;
8. full verification across backend tests, client tests, typecheck, security checks, and web export.

Centrifugo and Expo SQLite remain follow-on slices and must not block Messenger V1 completion.
