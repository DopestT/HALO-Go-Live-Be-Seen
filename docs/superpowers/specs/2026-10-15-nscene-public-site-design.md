# NSCENE Public Site Completion — Design

Date: 2026-10-15
Status: Approved direction carried forward into implementation
Canonical repository: `DopestT/HALO-Go-Live-Be-Seen`

## Goal

Turn the current Tube authenticated app shell into the public-facing NSCENE destination while preserving the existing live-video, creator, moderation, payments, and provider foundations.

## Public identity

- Public name: **NSCENE**
- Tagline: **See It. Share It. Live It.**
- Motto: **Built to amplify, not manipulate.**
- Primary domain: **nscene.watch**
- Stable internal/native identifiers may retain legacy Tube/HALO values until a deliberate migration is required.

## Primary navigation

The public desktop/web navigation is:

`LIVE | UPLOADS | CLIPS | SHOWS | CREATORS | COMMUNITIES`

The creator Studio is not a primary navigation tab. Authenticated users reach Studio from the account/avatar menu.

## Public-first behavior

Browsing is public. A visitor must not be forced through sign-in before seeing the product.

Authentication is required only for actions that need an identity or permission, such as going live, creator Studio, account settings, following, subscriptions, posting, or other authenticated mutations.

## First implementation slice

This slice completes the public web shell without pretending unverified backend features are already live:

1. Replace Tube/HALO public copy in the app shell with NSCENE copy.
2. Make the main browse experience available before authentication.
3. Add the six approved public navigation destinations.
4. Keep the existing Live discovery surface as the working Live destination.
5. Add distinct, honest empty-state destinations for Uploads, Clips, Shows, Creators, and Communities rather than fake production data.
6. Move Studio access out of primary navigation and into the authenticated account menu.
7. Keep Sign in visible as an action for signed-out visitors.
8. Preserve existing Go Live/Studio implementation and account implementation.
9. Keep the current neutral/black visual system and responsive wide-screen behavior.
10. Add tests that pin brand copy, public navigation, signed-out browsing, and Studio placement.

## Non-goals for this slice

- Do not invent real uploads, shows, creator records, or community activity.
- Do not claim LiveKit, Stripe, OAuth audience import, backup/restore, OBS ingest, or mobile-store production verification unless separately exercised.
- Do not migrate bundle IDs, URL schemes, database IDs, or provider identifiers merely for the public rename.
- Do not attach or switch the production domain until the preview is verified.

## Acceptance criteria

- A signed-out visitor can see NSCENE and the public browse shell.
- The six approved public navigation labels are present in the app shell.
- Live opens the existing discovery feed.
- The five not-yet-wired destinations clearly identify their lane and do not fabricate production content.
- Sign in is available to signed-out visitors without blocking browsing.
- Studio appears only for authenticated users and is not one of the six primary navigation tabs.
- Existing Go Live flow remains reachable through Studio.
- Existing account screen remains reachable.
- Tests and TypeScript verification pass on the branch before promotion.