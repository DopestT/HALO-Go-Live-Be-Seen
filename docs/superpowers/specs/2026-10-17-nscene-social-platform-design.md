# NSCENE: native video, social feed, Messenger and connected accounts

Status: proposed design for Kevin's review. Product scope approved in conversation; this document is not an implementation or deployment claim.

## Outcome

NSCENE becomes a creator network with native video, a visual social feed, private messaging, and authorized connections to creators' existing YouTube and Instagram accounts. Preserve the approved black-and-gold discovery home, news chyron and creator-led presentation. One NSCENE identity spans every native surface.

Success means real accounts complete real flows, not populated demonstration screens. External integrations must work within provider permissions; a connection does not automatically migrate followers, message histories, or media rights.

## Approach

Recommended: native foundation first, provider connections second. The existing Go API, PostgreSQL, React Native/Expo client and JWT authentication stay canonical. This produces an independent product and allows meaningful two-account tests before external application review is complete.

Alternatives considered:
- Integrations first: quickly aggregates external profiles but leaves NSCENE dependent on providers and without its own social loop.
- Build every subsystem together: broader initial surface but delays verification and increases migration, privacy and provider-review risk.

These are separately deliverable subsystems: identity/Messenger; native publishing/following; video processing and channels; provider connections. Each receives a focused implementation plan and acceptance evidence.

## Existing evidence

Inspected October 17, 2026:
- `backend/cmd/api/main.go`: registration/login/me, public creator/video reads and engagement endpoints are wired.
- `backend/migrations/001_init.sql`: existing users and videos.
- `backend/migrations/002_live_network_core.sql`: channel/follow structures already exist; extend them instead of creating competing identities.
- `backend/internal/audience`: consent-based audience restoration logic exists but is not a working external account connection.
- `src/contexts/AuthContext.tsx`: current token and user state are in memory; session persistence/recovery is not a complete durable session design.
- `src/api/authClient.ts` and `src/api/publicClient.ts` disagree on the API environment variable. Resolve this before authenticated feature acceptance.
- No wired Messenger, native post creation or provider OAuth endpoints were found in the inspected API router.
- Backend reachability and physical-device acceptance must be verified independently of the web preview.

## Product surfaces

Watch: native long-form uploads and short clips, channel pages, follows/subscriptions (free follows first), playlists, comments, saved videos and watch history. Paid subscriptions are a separate later feature.

Feed: chronological Following and discovery views, text/photo posts, photo carousels and short videos. Posts have likes, comments, saves, reports and Share to Messenger. Recommendation ranking comes after reliable publishing and instrumentation.

Messenger: dedicated Messages destination, inbox and conversation view, then groups, replies, attachments, delivery/read indicators and notifications. A conversation pane can coexist with browsing on desktop; phones use full-screen routes.

Connections: Account → Connected accounts with YouTube and Instagram. Show account identity, granted capabilities, last successful sync, expiry/error state and Disconnect. Never label an account connected until the provider callback and identity lookup succeed.

## First implementation slice: identity and direct Messenger

Build authenticated one-to-one text messages and native-content links. This is the first subsystem, not the entire social platform.

UX:
1. Sign in or register through the backend, with validated errors and a consistent API origin.
2. Open Messages. Empty inbox has a New conversation action; search uses public usernames/display names, never email enumeration.
3. Select a real recipient. New contacts enter a message-request state; allow one introductory message until accepted. Reject/block stops further sends.
4. Accept a request, exchange messages and revisit persisted history. Show sending, sent and failed states without claiming delivery before server acknowledgment.
5. Block or report from the conversation menu. No fake online indicators or read receipts.

Data and authorization:
- Reuse numeric user IDs. Add conversations, conversation_members, messages, user_blocks and message_reports through an additive migration.
- Exactly two users per direct conversation; a canonical pair uniqueness constraint prevents duplicate direct threads.
- Membership and request state are checked on every read/write. Derive sender identity from the authenticated JWT, never from client-provided sender IDs.
- Message insertion and block/request checks execute transactionally so concurrent blocking cannot be bypassed by a send race.
- Body limit: 4,000 Unicode characters; links are plain text, not trusted HTML. Native content attachments reference accessible NSCENE object IDs, not arbitrary private resource URLs.
- Client-generated idempotency key is unique per sender. Retrying a timed-out send returns the existing message rather than duplicating it.
- Cursor pagination orders by server-created message ID. Each response is bounded to 50 messages.
- Store last-read position per member for unread counts. Do not expose read receipts in the first slice.
- No message bodies or tokens in routine logs. Reports retain the referenced message and reporting actor for restricted moderator review.
- First slice uses authenticated polling while the conversation is visible, with cancellation on navigation, sign-out or account change. Server persistence is authoritative. WebSocket delivery is a later transport enhancement.

Proposed endpoints under /api/v1, all authenticated:
- GET /conversations
- POST /conversations/direct (recipient ID; idempotent pair lookup)
- POST /conversations/:id/accept
- GET /conversations/:id/messages?before=cursor
- POST /conversations/:id/messages (body, client_message_id, optional native-content reference)
- POST /conversations/:id/read (last message ID belonging to that conversation)
- POST /users/:id/block and DELETE /users/:id/block
- POST /messages/:id/report

Privacy statement: access-controlled private messaging, not end-to-end encrypted messaging. Do not advertise E2EE. A later E2EE design requires device keys, recovery, multi-device behavior and explicit report handling.

First-slice acceptance:
- Two real test accounts exchange and retrieve persisted messages after reload/re-login.
- A third account cannot list, read, mark read, accept or send into their conversation, including guessed IDs.
- Block and pending-request rules hold under concurrent sends.
- Retry produces one stored message; failed sends remain visibly failed.
- Sign-out/account switch clears all message state and cancels requests.
- Errors, pagination, keyboard navigation and mobile layout work without demo records.
- Migration and transaction tests run against PostgreSQL; production remains gated until these and two-account HTTP checks pass.

## Native publishing and Watch follow-on

Use existing channels/follows rather than adding a second graph. Establish a post model with ordered media attachments, visibility, owner, moderation state and stable native URLs. Server checks ownership for edit/delete and visibility for every share.

Uploads go through short-lived authorized upload intents to controlled object storage. Enforce file size/type limits server-side, inspect uploaded bytes, process video asynchronously and publish only after processing/moderation succeeds. Do not accept arbitrary stream URLs as proof of an owned upload. Provider embeds remain separately attributed external content.

Build a chronological following feed before recommendations. Interactions are idempotent, authenticated and rate-limited. Visible counts come from stored activity. Deleted/private posts shared in messages render an unavailable card, not a leaked cached copy.

Milestone: account A publishes a photo post and playable video, account B follows A, sees the new content and shares it through a private conversation. Verify actual persisted records and playback.

## YouTube connection

Use Google's supported OAuth flow for user-authorized channel access. Start with channel identity and allowed metadata; render eligible external videos with provider-supported playback and attribution. Add publishing only as a separate granted capability and deliberate user action.

Store refresh credentials encrypted server-side with minimal scopes. Bind callbacks to the authenticated NSCENE user through expiring one-use state; use PKCE where supported by the selected flow. Handle revocation, expiry, disconnect and provider errors. Keep credentials out of browser storage, client bundles and logs.

Do not download/rehost YouTube video files or assume permission to migrate subscribers. Upload quotas, OAuth verification and any API audit restrictions are release gates to confirm for the actual registered application.

## Instagram connection

Use the Instagram API with Instagram Login for eligible professional accounts. The current documented integration targets business/creator accounts; a personal Instagram login is not equivalent to supported professional API access.

Start with supported profile/media metadata. Add publishing and professional-inbox features only when their required permissions and review are actually granted. Keep external Instagram conversations distinct from NSCENE messages and clearly mark their source and provider limitations. Do not promise unrestricted synchronization of personal Instagram DMs.

Connection grants and disconnect behavior follow the same server-side credential and callback boundaries as YouTube. Cross-posting must show the destination account and result for each platform; partial failures must not appear as universal success.

## Explicitly deferred from first slice

Group chat, attachments, voice/video calls, push notifications, E2EE, payments, recommendation algorithms, stories expiration and automated cross-posting. These remain on the product roadmap, not hidden partial implementations.

## Release sequence

1. Align authentication configuration and verify the backend/database environment.
2. Implement and verify direct Messenger with message requests, blocking and reporting.
3. Implement posts/follows and media uploads; prove the native publish → discover → message loop.
4. Add read-only YouTube/Instagram connections using actual application registrations and test accounts.
5. Add provider publishing, groups, media messages and notifications in individually tested increments.

No developer accounts, paid infrastructure, production schema changes, external posts or messages are created merely by approving this design. Testing uses explicitly designated accounts and content.

## Provider documentation checked October 17, 2026

- Google OAuth: https://developers.google.com/youtube/v3/guides/authentication
- Google upload guide: https://developers.google.com/youtube/data/guides/uploading_a_video
- Meta's official Instagram API collection: https://www.postman.com/meta/instagram/folder/6raa77c/instagram-api-with-instagram-login

Provider capabilities must be rechecked during integration implementation against the chosen application/API version.
