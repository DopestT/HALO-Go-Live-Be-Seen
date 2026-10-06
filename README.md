# Tube — Independent Live Network

Tube is a standalone live-video network for creators, organizers, labor groups, campus groups, independent journalists, campaigns, educators, community broadcasters, and other public-interest creators.

Tube is being repurposed from the earlier HALO direction. Existing streaming, backend, moderation, payments, and infrastructure work is retained where it serves the new architecture; unrelated legacy assumptions are not canonical.

## Product principles

- **Independent platform state:** Tube owns accounts, channels, broadcasts, moderation records, subscriptions, audience-import state, recordings, analytics, and audit history.
- **Replaceable providers:** LiveKit is the first streaming engine, but provider-specific identifiers remain behind internal adapters.
- **Audience portability:** creators can connect supported external platforms and bring authorized audience relationships into Tube as external references without silently creating accounts for third parties.
- **Transparent discovery:** recommendations and paid promotion must have an understandable reason and paid ranking must be labeled.
- **No advertising-maximization core:** subscriptions, direct support, organization plans, events, and optional services are preferred over behavioral advertising.
- **No hidden ideological gate:** early creator acquisition may focus on progressive/public-interest communities, while access and moderation remain governed by published rules and safety standards.

## Canonical architecture

```text
Clients (Web / iOS / Android)
        |
        v
Tube API + Realtime Layer
  |- Identity / Channels / Organizations
  |- Broadcast orchestration
  |- Audience portability
  |- Discovery
  |- Chat / Moderation
  |- Subscriptions / Entitlements
  |- Recordings / Clips
  |- Action links / Analytics / Audit
        |
        +--> PostgreSQL (durable canonical state)
        +--> Redis (presence, counters, coordination)
        +--> Object storage (recordings / exports)
        +--> Provider adapters
              |- LiveKit first
              |- Payment processors
              `- Audience import providers
```

## Repository structure

```text
HALO-Go-Live-Be-Seen/
├── src/                     # Canonical React Native / Expo client
├── backend/                 # Go API and domain services
│   ├── cmd/api/
│   ├── internal/
│   └── migrations/
├── docs/superpowers/specs/  # Architecture specification
├── docs/superpowers/plans/  # Implementation plan
├── __tests__/               # Root client tests
└── halo-app/                # Legacy/alternate app tree pending consolidation
```

The root `src/` client is canonical for new work. `halo-app/` is legacy/alternate code until explicitly migrated or removed.

## Current implementation base

- React Native / Expo / TypeScript client
- Go / Gin backend
- PostgreSQL
- Redis
- LiveKit integration points
- Stripe integration points
- JWT authentication
- reporting / blocking / moderation foundations
- GitHub Actions / CodeQL

## Verification

Root client:

```bash
npm ci --legacy-peer-deps
npm run test:ci
npm run typecheck
```

Backend:

```bash
cd backend
go test ./...
go build ./cmd/api
```

## Design and implementation documents

- Architecture: `docs/superpowers/specs/2026-10-04-independent-live-network-design.md`
- Implementation plan: `docs/superpowers/plans/2026-10-04-independent-live-network.md`

## Public-beta rule

A feature is not considered verified merely because code exists. Public beta requires green repository CI plus staging verification for real LiveKit, payment, OAuth/import-provider, backup/restore, and moderation flows that cannot be proven without external credentials or infrastructure.

## License

Proprietary software. All rights reserved.
