# HALO Independent Live Network — Architecture Design

Date: 2026-10-04
Status: Written specification for review
Canonical repository: `DopestT/HALO-Go-Live-Be-Seen`
Working product name: **HALO**

## 1. Purpose

HALO is repurposed as a standalone Twitch-like live-video network for creators, organizers, labor groups, campus groups, independent journalists, progressive advocates, campaigns, educators, community broadcasters, and other public-interest creators who need a live platform that is not structurally dependent on large advertising companies.

HALO is a standalone product. It is not a feature of NETIZENS, Representative X, Archangels Club, Eye85Media, or another Legacy Works Ventures property. Those products may later integrate with HALO through stable APIs, embeds, account linking, and deep links.

The platform does not require ideological conformity. Its early creator base may lean progressive, but moderation and access are governed by transparent rules, safety standards, and conduct rather than a hidden political loyalty test.

Core promise:

> creators and communities can broadcast, build audiences, organize, monetize, and retain durable access to their content and relationships without the platform being optimized primarily for advertising extraction.

## 2. Canonical Repository Decision

`DopestT/HALO-Go-Live-Be-Seen` is the canonical engineering base for this product.

The prior HALO product direction is superseded by this specification. Existing code is retained only where it contributes to the new platform.

Useful existing foundations include:

- React Native / Expo client work;
- LiveKit integration points;
- Go backend services;
- PostgreSQL;
- Redis;
- Stripe-related payment work;
- reporting, blocking, moderation, and safety concepts;
- existing tests and CI/security work;
- prior anti-dark-pattern and calm-design direction.

Legacy features that do not serve the new product should be removed or isolated rather than preserved for compatibility.

`DopestT/MVP-Live` remains non-canonical and primarily useful as an asset/reference repository. `DopestT/Neon-Live` remains a small prototype and should not become a competing implementation.

## 3. Product Principles

### 3.1 Platform independence

HALO owns its own product state. Media vendors may transport or process video, but they do not own the application model.

Canonical HALO state includes:

- accounts and profiles;
- channels;
- organizations;
- follows and subscriptions;
- stream metadata and schedules;
- permissions and roles;
- chat and moderation records;
- reports, enforcement actions, and appeals;
- monetization and payout records;
- discovery metadata;
- recordings and clip metadata;
- analytics and audit history;
- source/action links attached to broadcasts.

### 3.2 No advertising-maximization core

HALO should be economically viable without behavioral advertising or sale of user data.

Primary monetization paths:

- creator subscriptions;
- direct creator support;
- organization plans;
- paid or ticketed events where appropriate;
- optional creator/platform services;
- clearly labeled sponsorship if introduced later.

Secret paid ranking is prohibited.

### 3.3 Transparent discovery

Every surfaced live stream should be attributable to an understandable reason such as:

- followed channel;
- category relevance;
- geography;
- recency;
- current audience activity;
- editorial feature;
- explicit paid promotion.

Paid promotion must be labeled.

### 3.4 Action after viewing

A live broadcast should be able to connect viewers to:

- source documents;
- related organizations;
- upcoming events;
- volunteering;
- donations;
- representative contact tools;
- petitions or campaigns;
- related broadcasts;
- follow-an-issue actions.

### 3.5 No dark-pattern growth mechanics

The product should not depend on fake urgency, disguised ads, intentionally confusing cancellation flows, forced infinite-scroll behavior, or manipulative notification defaults.

Retention should come from useful live programming, communities, subscriptions, scheduled events, and direct creator relationships.

## 4. Audience Portability — First-Class Feature

A creator should not have to rebuild an audience from zero when joining HALO.

HALO therefore provides an **Audience Portability** onboarding flow.

### 4.1 Connect existing platforms

A creator may connect supported external services using OAuth or provider-approved authorization.

Initial connector targets:

- Twitch;
- YouTube;
- Patreon;
- Discord where technically and contractually allowed;
- newsletter/email-list import through consent-compliant CSV or provider integrations;
- additional creator platforms later.

### 4.2 Importable audience records

HALO may import only data the creator is authorized to access and only for purposes allowed by the upstream provider.

Imported records are stored as **external audience references**, not HALO user accounts.

Example:

```text
external_audience_reference
- provider: twitch
- creator_channel_id
- external_user_id
- public_display_name (if allowed)
- relationship_type: follower/subscriber/member
- relationship_since (if supplied)
- membership_tier (if supplied and allowed)
- source_sync_time
- invitation_status
- claimed_halo_user_id (nullable)
```

HALO must not silently create accounts for third parties.

### 4.3 Claim-and-restore flow

When an imported fan later joins HALO and links the same external identity, HALO can match the relationship and immediately:

- suggest or automatically restore the follow relationship with explicit onboarding consent;
- recognize prior membership/support status where permitted;
- surface the creator prominently in onboarding;
- attach any creator-granted migration benefit;
- mark the external audience reference as claimed.

The goal is that a fan who follows a creator elsewhere can join HALO and find that creator instantly.

### 4.4 Creator migration link

Each creator receives a migration URL such as:

```text
halo.example/join/@creator
```

The landing flow should:

1. explain who invited the fan;
2. create or sign in to HALO;
3. connect an external identity optionally;
4. follow the creator in one tap;
5. import or recognize eligible memberships where supported;
6. optionally follow related channels selected by the user, never by hidden bundling.

### 4.5 Bulk outreach without spam

Where a creator lawfully controls an email list, HALO can assist with an opt-in migration campaign.

HALO should provide:

- import validation;
- deduplication;
- consent/permission flags;
- unsubscribe handling;
- rate-limited invitation sending;
- creator-branded migration pages;
- conversion analytics.

The system must not turn scraped follower data into unsolicited email or SMS campaigns.

### 4.6 Migration dashboard

Creator Studio should show:

- external audience size by platform;
- imported/eligible audience references;
- invitation sends where allowed;
- migration-link visits;
- HALO signups attributable to the creator;
- claimed external identities;
- converted followers;
- converted paid supporters;
- conversion rate by source.

### 4.7 Audience portability as product strategy

This is not a minor import tool. It is a primary growth mechanic.

The creator pitch should effectively be:

> bring your audience with you instead of starting over.

## 5. System Architecture

HALO uses a provider-independent application architecture.

```text
Clients
├── Web
├── iOS
└── Android
     │
     ▼
HALO API / Realtime Layer
├── Identity & Auth
├── Channels & Organizations
├── Audience Portability
├── Stream Orchestrator
├── Discovery
├── Chat & Reactions
├── Moderation
├── Subscriptions / Payments
├── Recording / Clips
├── Notifications
├── Action Links
├── Analytics
└── Audit Events
     │
     ├── PostgreSQL
     ├── Redis
     ├── Object Storage
     └── Provider Adapters
          ├── Streaming providers
          └── Audience-import providers
```

## 6. Streaming Architecture

### 6.1 Initial media engine

Use LiveKit as the first production media engine because the current repository already contains LiveKit work and it supports the required interactive streaming foundation.

Managed LiveKit may be used initially for speed, provided HALO application data remains independent and the provider abstraction is enforced.

### 6.2 Provider interface

The backend exposes an internal streaming-provider contract rather than allowing UI/domain code to call LiveKit directly.

Conceptual interface:

```ts
interface StreamingProvider {
  createChannel(input)
  createBroadcast(input)
  createPublisherCredential(input)
  createViewerCredential(input)
  getPlaybackTarget(input)
  endBroadcast(input)
  getViewerCount(input)
  startRecording(input)
  stopRecording(input)
  createClip(input)
}
```

First adapter: `LiveKitProvider`.

Future adapters may include other distribution providers without changing channel, payment, moderation, or discovery models.

### 6.3 Broadcast modes

HALO supports:

1. Interactive room — host plus guests with WebRTC participation.
2. Town hall/interview — small active stage plus larger view-only audience.
3. Mass broadcast — production room feeding a scalable distribution layer.

### 6.4 Creator ingest

Creators must be able to go live through:

- HALO mobile app;
- HALO web creator studio;
- OBS or equivalent desktop broadcast software through a stream key / compatible ingest path.

## 7. Core Product Surfaces

### 7.1 Home

- Live Now
- Following
- recommended categories
- local/geographic live programming
- upcoming scheduled streams
- clearly labeled editorial or sponsored placements

### 7.2 Channel page

- live player
- live chat
- follow
- subscribe/support
- creator/organization identity
- schedule
- past broadcasts
- clips
- about
- source/action links where applicable

### 7.3 Creator Studio

- Go Live
- browser camera/microphone setup
- OBS/stream key setup
- title/category/tags/geography/language
- schedule stream
- guest/co-host controls
- moderator assignment
- recording settings
- live analytics
- post-stream recording and clip management
- Audience Portability dashboard

### 7.4 Discovery categories

Initial categories:

- Politics & Government
- Labor
- Campus
- Organizing
- Independent Journalism
- Elections
- Local Government
- Civil Rights
- Housing
- Healthcare
- Climate
- International
- Education
- Culture
- Community

Categories are metadata, not ideological gates.

### 7.5 Geographic discovery

Streams may be indexed by country, state/region, locality, and campus where relevant.

## 8. Identity and Organizations

HALO supports:

- individual accounts;
- creator channels;
- organization accounts;
- organization-managed channels.

Organization roles may include owner, administrator, broadcaster, moderator, editor, and analyst. Permissions must be explicit and auditable.

## 9. Chat and Community

Live chat supports:

- messages;
- replies where useful;
- reactions;
- moderator messages;
- pinned messages;
- slow mode;
- follower-only mode;
- subscriber/member-only mode;
- link controls;
- block/mute;
- report.

## 10. Moderation and Safety

Required capabilities:

- stream report;
- chat report;
- timeout;
- mute;
- remove from room;
- channel ban;
- moderator roles;
- emergency stream termination;
- evidence capture for enforcement;
- enforcement reason codes;
- appeals;
- audit history;
- rate limiting and anti-spam controls.

Platform staff actions and organization moderator actions should be distinguishable in the audit log.

## 11. Recording, Archive, and Clips

Authorized streams may produce recordings.

Required capabilities:

- recording on/off policy by channel/event;
- recording lifecycle state;
- playback archive;
- creator-controlled publication;
- clip creation;
- clip metadata;
- share links;
- caption/transcript hooks later;
- deletion and retention-policy enforcement.

## 12. Monetization

Initial monetization supports:

- channel subscriptions;
- one-time creator support;
- organization plans;
- configurable platform fee;
- creator payout accounting.

Stripe may be the first processor, but HALO owns payment records and entitlement state. Provider events are reconciled into HALO's own entitlement ledger.

## 13. Minimum Domain Model

- `users`
- `profiles`
- `external_identities`
- `channels`
- `organizations`
- `organization_members`
- `channel_roles`
- `follows`
- `subscriptions`
- `external_audience_references`
- `audience_import_jobs`
- `audience_invites`
- `audience_claims`
- `broadcasts`
- `broadcast_participants`
- `stream_provider_sessions`
- `stream_keys`
- `categories`
- `broadcast_categories`
- `chat_messages`
- `moderation_reports`
- `moderation_actions`
- `appeals`
- `recordings`
- `clips`
- `action_links`
- `payments`
- `entitlements`
- `payouts`
- `notifications`
- `analytics_events`
- `audit_events`

Provider-specific identifiers must not become primary HALO domain identifiers.

## 14. API Boundaries

Primary API groups:

- `/auth`
- `/profiles`
- `/channels`
- `/organizations`
- `/audience-imports`
- `/broadcasts`
- `/streaming`
- `/chat`
- `/moderation`
- `/subscriptions`
- `/payments`
- `/recordings`
- `/clips`
- `/discovery`
- `/actions`
- `/notifications`
- `/admin`

The existing Go service should evolve toward these domains incrementally.

## 15. Realtime Layer

Redis initially supports:

- presence;
- viewer counts;
- chat fan-out coordination;
- rate-limit state;
- ephemeral room state;
- live discovery signals.

Durable state must be persisted to PostgreSQL or another explicitly designated durable store.

## 16. Data Ownership and Portability

HALO must be able to export its canonical records independent of streaming or audience-import providers.

Required operational capabilities:

- database backups;
- object-storage backups where applicable;
- restore drills;
- provider-session reconciliation;
- creator audience/export tools;
- account and channel data export;
- provider migration without changing public channel identity.

## 17. Initial Delivery Slices

The implementation should be decomposed rather than attempted as one giant change.

### Slice A — Canonical cleanup and architecture boundaries

- mark HALO as the canonical new product direction;
- inventory legacy code;
- identify code to retain/remove/isolate;
- establish domain packages;
- create provider interfaces;
- establish migration-safe database schema.

### Slice B — Live core

- creator channel;
- broadcast lifecycle;
- LiveKit adapter;
- viewer playback;
- basic live chat;
- Go Live flow;
- OBS/stream-key path;
- viewer count and presence.

### Slice C — Safety and moderation

- reports;
- mute/timeout/ban;
- moderator roles;
- emergency stop;
- audit trail;
- appeals foundation.

### Slice D — Audience Portability

- external identity linking;
- Twitch connector;
- YouTube connector;
- Patreon v2 connector;
- external audience-reference store;
- creator migration link;
- claim-and-restore flow;
- migration dashboard;
- consent-compliant CSV invite path.

### Slice E — Monetization

- channel subscriptions;
- support payments;
- entitlements;
- creator accounting;
- payout ledger.

### Slice F — Archive and clips

- recording lifecycle;
- archive pages;
- clips;
- sharing.

### Slice G — Discovery and civic/action layer

- categories;
- geographic discovery;
- transparent recommendation reasons;
- action links;
- source links;
- event/organization connections.

## 18. Acceptance Criteria for First Public Beta

A public beta is not ready until all of the following are true:

1. A creator can create a channel and go live from a supported client.
2. A creator can use OBS or equivalent ingest.
3. Viewers can discover and watch a live stream.
4. Viewers can chat, follow, block, and report.
5. Moderators can timeout, mute, ban, and end a stream according to role.
6. Stream state survives application restarts through durable canonical records.
7. LiveKit-specific IDs are isolated behind provider/session boundaries.
8. A creator can connect at least one external platform and run an audience import.
9. Imported people are represented as external references, never silently created HALO accounts.
10. A fan can join through a creator migration link and follow that creator in one clear flow.
11. A fan who links a matching supported external identity can have the prior relationship recognized.
12. Payment/entitlement state is stored in HALO and reconciled from the payment provider.
13. Core moderation actions are auditable.
14. Database backup and restore procedures are documented and exercised in staging.
15. Tests cover broadcast lifecycle, permissions, moderation, audience claims, entitlement reconciliation, and provider-adapter failure paths.

## 19. Explicit Non-Goals for Initial Beta

Do not block beta on:

- custom video codec development;
- building a proprietary SFU/media server;
- a full advertising marketplace;
- complex recommendation ML;
- nationwide political-data integration;
- federated identity;
- every possible creator-platform connector;
- replacing every managed infrastructure component on day one.

HALO should own the application architecture first and replace managed infrastructure strategically as usage justifies it.
