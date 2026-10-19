# NSCENE Messenger V1 Design

**Status:** Approved architecture; ready for implementation planning after spec review  
**Date:** 2026-10-19  
**Product:** NSCENE  
**Repository:** `DopestT/HALO-Go-Live-Be-Seen`

## 1. Goal

Build a first-party, persistent one-to-one messaging system inside NSCENE that is available to authenticated users across web, iPhone, and iPad code paths without depending on Apple Developer account services, APNs, or a third-party chat provider.

Success means:

- authenticated users can create, receive, accept, decline, and continue persistent direct conversations;
- inbox state, unread state, message requests, read state, block state, and reports survive app restarts because they are stored server-side;
- messages never interrupt or cover active video playback;
- blocked users cannot continue or restart messaging with the blocker;
- every user can access block and report controls from a conversation;
- the product exposes truthful empty/loading/error/offline/request states rather than fake activity;
- the implementation remains compatible with the current React Native / Expo client and Go / PostgreSQL backend;
- Messenger V1 can be developed and tested without iOS signing or push-notification credentials.

## 2. Product Placement

Messenger is an authenticated NSCENE product surface, not a seventh public content lane.

The public navigation remains:

`LIVE | UPLOADS | CLIPS | SHOWS | CREATORS | COMMUNITIES`

Signed-in users gain:

- a Messages entry in the account menu;
- a compact message icon/badge in the authenticated header surface;
- an inbox route at `/messages`;
- a direct conversation route at `/messages/:conversationId`.

Signed-out attempts to open Messenger must route to sign-in. No message metadata, inbox counts, thread previews, or participant details are exposed before authentication.

## 3. V1 Scope

Messenger V1 includes:

- persistent one-to-one direct messages;
- inbox list;
- conversation detail;
- message requests;
- accept and decline request actions;
- unread counts and per-thread unread state;
- read state;
- sender identity and recipient identity;
- block user;
- report message or user from a conversation;
- local inbox hiding for a thread;
- failed-send and retry state;
- loading, empty, offline, permission-denied, blocked, declined, and unavailable states;
- playback-safe in-app unread indicators.

Messenger V1 does not include:

- group conversations;
- audio or video calling;
- image, video, document, or voice-note attachments;
- disappearing messages;
- end-to-end encryption claims;
- message editing;
- per-message deletion/unsend;
- reactions;
- typing indicators;
- presence or “active now” claims;
- APNs or other native push notifications;
- email or SMS message notifications;
- automated AI replies;
- third-party chat infrastructure.

These exclusions are intentional. They keep the first release testable, reduce abuse surface, and avoid coupling the build to Apple Developer account work.

## 4. Conversation Rules

V1 conversations are direct and unique per user pair.

For any two users A and B, NSCENE may have only one canonical direct conversation record for that pair. Reopening a conversation reuses the same canonical record rather than creating duplicate threads.

A user cannot message themself.

A brand-new conversation begins as a message request for the recipient.

The sender may submit exactly one initial message while the recipient has not yet accepted the request. Until acceptance:

- the sender sees the thread as `PENDING`;
- the recipient sees it under `REQUESTS`;
- the sender cannot send additional messages;
- the recipient can accept, decline, block, or report.

On acceptance, both participants may send messages normally.

On decline:

- no additional messages may be sent in that conversation;
- the declined thread leaves the recipient's active Requests view;
- the sender sees a non-interactive declined state rather than a false delivery state;
- starting another conversation with the same user pair does not bypass the decline.

A later product change may define a separate re-request policy, but V1 does not automatically reopen declined requests.

## 5. Persistence Model

The authoritative Messenger state lives in PostgreSQL through the existing NSCENE backend.

### `conversations`

Required fields:

- `id BIGSERIAL PRIMARY KEY`
- `kind VARCHAR(16) NOT NULL DEFAULT 'direct'`
- `created_by BIGINT NOT NULL REFERENCES users(id)`
- `direct_user_low_id BIGINT NOT NULL REFERENCES users(id)`
- `direct_user_high_id BIGINT NOT NULL REFERENCES users(id)`
- `request_status VARCHAR(16) NOT NULL`
- `created_at TIMESTAMP NOT NULL`
- `updated_at TIMESTAMP NOT NULL`
- `last_message_at TIMESTAMP NULL`

Constraints:

- `direct_user_low_id < direct_user_high_id`;
- unique pair on `(direct_user_low_id, direct_user_high_id)`;
- V1 `kind` is `direct`;
- V1 `request_status` values are `pending`, `accepted`, `declined`.

The low/high pair is derived server-side from authenticated sender and target user IDs. Clients never choose or override the canonical ordering.

### `conversation_participants`

Required fields:

- `conversation_id BIGINT REFERENCES conversations(id) ON DELETE CASCADE`
- `user_id BIGINT REFERENCES users(id) ON DELETE CASCADE`
- `last_read_message_id BIGINT NULL`
- `hidden_at TIMESTAMP NULL`
- `created_at TIMESTAMP NOT NULL`

Primary key:

- `(conversation_id, user_id)`

Each direct conversation must have exactly two participant rows corresponding to the canonical user pair.

`hidden_at` implements “Delete from inbox” for V1. It hides the thread for that user without deleting the other participant's history or destroying moderation evidence. A new persisted message from the other participant in an accepted conversation clears only that recipient's `hidden_at` value and makes the thread visible again.

### `messages`

Required fields:

- `id BIGSERIAL PRIMARY KEY`
- `conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE`
- `sender_id BIGINT NOT NULL REFERENCES users(id)`
- `body TEXT NOT NULL`
- `created_at TIMESTAMP NOT NULL`

Rules:

- message body is plain text in V1;
- leading/trailing whitespace is normalized server-side;
- empty messages are rejected;
- maximum normalized body length is 4,000 Unicode characters;
- sender must be one of the two conversation participants;
- request-state rules are enforced by the server, not trusted to client UI.

### `user_blocks`

Required fields:

- `blocker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `blocked_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `created_at TIMESTAMP NOT NULL`

Primary key:

- `(blocker_id, blocked_user_id)`

A user cannot block themself.

If either participant has blocked the other, the backend rejects new message sends between the pair. A block also removes the conversation from the blocker's active inbox view.

Blocking does not mutate `request_status`. On unblock, the conversation returns to its previous request state: an accepted conversation can resume messaging; a pending conversation remains pending; a declined conversation remains declined. A previously hidden thread remains hidden until the user deliberately reopens it or a later accepted incoming message clears that participant's hidden state.

### `moderation_reports`

Messenger V1 requires a durable moderation report record if the backend does not already expose one suitable for messages/users.

Minimum fields:

- reporter user ID;
- target type (`message` or `user`);
- target ID;
- optional conversation ID when report originates from Messenger;
- reason code;
- optional text detail, maximum 1,000 Unicode characters;
- created timestamp;
- review status.

V1 reason codes are:

- `spam`
- `harassment`
- `hate_or_abuse`
- `sexual_content`
- `threat_or_violence`
- `impersonation`
- `other`

The existing client-side reporting helper may be adapted to this backend contract, but client helper success must never substitute for durable server persistence.

## 6. API Boundary

All Messenger endpoints live under the existing authenticated `/api/v1` backend and require the existing auth middleware.

V1 endpoints:

- `GET /api/v1/messages/conversations?bucket=inbox|requests&cursor=...`
- `POST /api/v1/messages/conversations`
- `GET /api/v1/messages/conversations/:id?cursor=...`
- `POST /api/v1/messages/conversations/:id/messages`
- `POST /api/v1/messages/conversations/:id/accept`
- `POST /api/v1/messages/conversations/:id/decline`
- `POST /api/v1/messages/conversations/:id/read`
- `DELETE /api/v1/messages/conversations/:id/inbox`
- `POST /api/v1/messages/users/:id/block`
- `DELETE /api/v1/messages/users/:id/block`
- `POST /api/v1/messages/reports`
- `GET /api/v1/messages/unread-count`

`POST /api/v1/messages/conversations` accepts a target user ID and an initial message. The authenticated session determines the sender. The backend must ignore or reject any client-supplied sender identity.

Collection endpoints use bounded cursor pagination. No Messenger list endpoint may return an unbounded history.

## 7. Authorization and Security

Every conversation operation must verify that the authenticated user is a participant or is otherwise authorized for the requested moderation action.

Security requirements:

- derive acting user identity only from the authenticated session/JWT;
- parameterize all database queries;
- reject access to conversations where the actor is not a participant;
- reject sends when request status, decline state, or block state forbids messaging;
- reject direct-message creation to a nonexistent target;
- reject self-messaging;
- enforce message-length limits server-side;
- do not fetch arbitrary URLs from message text;
- render message bodies as text, never executable HTML;
- do not expose private email addresses or internal auth fields in participant payloads;
- return stable public error codes for UI state rather than leaking database details.

Baseline per-user rate limits for V1 are:

- conversation creation: 10 attempts per hour;
- message send: 30 attempts per minute;
- reports: 20 attempts per hour;
- block/unblock actions combined: 30 attempts per hour.

Rate-limit rejection returns `rate_limit_exceeded`. These limits may be made stricter by operational configuration, but code must not silently allow a higher default.

No V1 documentation or UI may claim end-to-end encryption unless a later implementation actually supplies and independently verifies it.

## 8. Inbox UX

### Desktop and wide iPad

Use a two-pane layout:

- left: inbox/search/filter/thread list;
- right: selected conversation or an empty selection state.

Primary filters:

- `INBOX`
- `REQUESTS`

Each thread row may show:

- avatar;
- display name / username;
- last-message preview;
- timestamp;
- unread indicator;
- pending-request indicator where applicable.

Do not display fabricated online presence.

### Phone and compact widths

Use single-pane navigation:

- inbox list first;
- selecting a thread opens a full conversation view;
- system/native back behavior returns to inbox;
- controls remain touch-safe and do not depend on hover.

## 9. Conversation UX

Conversation header:

- avatar;
- display name / username;
- profile access;
- overflow menu for block, report, and hide-from-inbox.

Conversation body:

- chronological messages;
- visually distinct own/other message treatment;
- timestamps sufficient to understand sequence;
- explicit pending, declined, blocked, loading, error, and retry states;
- cursor-based older-message loading.

Composer:

- multiline plain-text input;
- send action;
- disabled when policy forbids send;
- local sending state;
- failure state with deliberate retry;
- no optimistic “delivered” claim before server persistence succeeds.

Read state:

- opening an accepted conversation may advance `last_read_message_id` after messages have been successfully loaded;
- unread count is computed from durable message/read state, not only local memory;
- V1 does not display per-message “seen by” receipts to the sender.

## 10. Message Requests

Requests are a separate inbox bucket.

Recipient actions:

- **Accept** — transitions conversation to `accepted` and enables normal messaging;
- **Decline** — transitions conversation to `declined`; no further sends are allowed;
- **Block** — records block state and prevents further messaging;
- **Report** — records a moderation report and leaves the user free to block separately.

Accepting, declining, blocking, or reporting must not be simulated solely in client state.

## 11. Playback-Safe Notification Rule

Messenger must obey the locked NSCENE video rule: alerts and messages never interrupt or cover active video playback.

When a new unread message is detected while video is active:

- do not show a modal;
- do not overlay a message preview on the video;
- do not pause or resize playback;
- do not navigate away automatically;
- do not take keyboard/input focus;
- show only a subtle player-edge glow and/or small unread badge outside obstructive playback controls.

The user explicitly opens Messenger to view the message.

When video is not active, the authenticated header may update its unread badge. V1 does not require native push notifications.

## 12. Realtime Strategy

Persistence correctness comes before realtime transport.

V1 uses request/response synchronization plus foreground polling:

- while the authenticated app is foregrounded, unread count and currently visible Messenger data refresh every 10 seconds;
- a successful send, accept, decline, block, unblock, read, or hide action updates local state immediately from the server response rather than waiting for the next poll;
- polling is suspended when the app/browser is backgrounded or the relevant surface is unmounted where the platform exposes that lifecycle;
- network failures do not erase the last successfully loaded state and must surface a retry/offline indication.

A later approved slice may add WebSocket/SSE/realtime delivery without changing the persistence contract.

This avoids making Messenger dependent on a new infrastructure subsystem during the initial implementation and keeps the V1 build independent of Apple push credentials.

## 13. Client Architecture

Add a dedicated Messenger client boundary rather than placing HTTP calls inside screens.

Responsibilities:

- `src/api/messageClient.ts` — typed authenticated Messenger API calls;
- `src/screens/messages/MessagesScreen.tsx` — inbox and responsive shell;
- `src/screens/messages/ConversationScreen.tsx` — thread state and composer;
- focused components for thread rows, message bubbles, request actions, composer, and conversation menu;
- route parsing/navigation support for `/messages` and `/messages/:conversationId`;
- account/header integration for Messenger entry and unread badge.

The screen layer must distinguish loading, empty, error, offline, pending, declined, blocked, and permission-denied states.

## 14. Backend Architecture

Add a focused backend messaging package consistent with existing backend patterns rather than embedding messaging logic into auth or video handlers.

Responsibilities:

- models / request-response DTOs;
- repository queries;
- service/policy layer for pair uniqueness, request transitions, block checks, and send authorization;
- HTTP handlers;
- authenticated route registration;
- database migration;
- tests for authorization and policy boundaries.

The backend is authoritative for conversation/request/block/read state.

## 15. Error Semantics

Client-visible error classes are:

- `unauthorized`
- `forbidden`
- `conversation_not_found`
- `user_not_found`
- `self_message_not_allowed`
- `message_request_pending`
- `message_request_declined`
- `user_blocked`
- `message_too_long`
- `invalid_message`
- `rate_limit_exceeded`
- `internal_error`

The UI maps these to human-readable states without displaying raw database or server internals.

## 16. Testing Requirements

Backend tests must cover at minimum:

- conversation pair uniqueness;
- self-message rejection;
- unauthenticated access rejection;
- nonparticipant thread access rejection;
- exactly one initial message while request is pending;
- accept transition;
- decline transition;
- send rejection after decline;
- block enforcement in both directions;
- unblock restores the prior request state rather than creating a new thread;
- rate-limit boundaries;
- 4,000-character boundary;
- empty-message rejection;
- durable read-state update;
- unread-count correctness;
- hide-from-inbox isolation per participant;
- report reason validation and persistence;
- 1,000-character report-detail boundary;
- pagination boundary behavior.

Client tests must cover at minimum:

- route parsing for inbox/thread routes;
- signed-out Messenger access gating;
- inbox vs Requests rendering;
- pending composer lock;
- declined and blocked states;
- send failure + retry without false delivery;
- unread badge rendering;
- 10-second foreground refresh behavior without duplicate timers;
- message notification does not overlay or interrupt active video;
- compact vs wide Messenger composition where current test tooling permits.

Existing verification, typecheck, security-policy, and backend test suites must remain green.

## 17. Privacy and Integrity

V1 stores message content on NSCENE-controlled backend infrastructure. The product must not represent this as end-to-end encrypted.

Logs must not record plaintext message bodies by default in production request logs. Controlled local debugging may inspect test message bodies, but production logging code must avoid message-body payloads.

Moderation access, retention policy, legal process handling, user export/deletion semantics, and any encryption-at-rest policy are broader platform governance decisions and are not silently invented by this V1 feature. The implementation must preserve enough structure to add those policies later without treating current behavior as a privacy promise that does not exist.

## 18. No-Developer-Account Constraint

Messenger V1 must be buildable and testable without Apple Developer account completion.

Therefore this slice does not require:

- APNs certificates or keys;
- iOS entitlements for push;
- TestFlight distribution;
- App Store provisioning;
- Apple background notification configuration.

Web tests, backend tests, Expo-compatible client tests, and other currently available build lanes remain sufficient for this implementation slice.

## 19. Acceptance Criteria

Messenger V1 is implementation-complete when:

- authenticated users can open `/messages` and a direct thread route;
- users can create a direct message request with one initial message;
- recipients can accept or decline requests;
- accepted users can exchange persistent text messages;
- duplicate direct threads cannot be created for the same pair;
- unread/read state survives reload and is server-backed;
- block state prevents messaging as specified;
- report actions persist to the backend;
- hide-from-inbox is local to the acting participant;
- all access-control checks are server-enforced;
- active video is never covered, paused, resized, or navigated away from by a message notification;
- no APNs/Apple developer dependency is introduced;
- no third-party chat provider is introduced;
- no UI or documentation makes unsupported encryption, presence, delivery, or moderation claims;
- automated tests cover the policy and authorization boundaries above;
- existing repository verification remains green.

## 20. Follow-On Slice

After Messenger V1 is implemented and verified, the next independent NSCENE build slice is Creator Studio / Create:

- authenticated Studio home;
- `Create` choice surface;
- Upload Video path;
- Go Live path reusing the existing live flow;
- upload/publish state and content management.

That work receives its own implementation plan and must not be bundled into the Messenger V1 implementation branch.
