# NSCENE Cross-Platform Product Design

**Status:** Approved design direction; implementation planning pending review  
**Date:** 2026-10-15  
**Product:** NSCENE  
**Primary domain:** `nscene.watch`  
**Figma:** `NSCENE — Official Product Design` (`https://www.figma.com/design/bhqX9v72yDySvySguvm1Qw`)

## 1. Goal

Design NSCENE as a full-scale creator/video network with YouTube-level product breadth while preserving NSCENE's own information architecture, identity, and creator-first behavior. The result must be mature enough to guide production implementation across iPhone/iOS 27, iPadOS 27, and desktop web without redesigning the product per platform.

Success means:

- a coherent, reusable design system rather than isolated mockups;
- approximately 60 major artboards covering core browse, watch, creator, community, account, and Studio flows;
- native iOS/iPadOS 27 behavior where platform conventions materially improve the experience;
- desktop views that preserve the same product model while using available space appropriately;
- no fake production data or fabricated platform activity represented as real product state;
- engineering can map every major screen to reusable components and explicit states.

## 2. Product Identity

Public product identity is locked:

- **Name:** NSCENE
- **Tagline:** `See It. Share It. Live It.`
- **Motto:** `Built to amplify, not manipulate.`
- **Primary public navigation:** `LIVE | UPLOADS | CLIPS | SHOWS | CREATORS | COMMUNITIES`

Creator Studio is not a primary public navigation item. Signed-in creators access Studio through the authenticated account/avatar surface.

Browsing is public. Authentication is required only for identity-bound actions such as following, commenting, uploading, going live, account management, moderation, and monetization.

## 3. Visual Direction

NSCENE is **not** a black-and-gold brand.

The interface uses a restrained cinematic dark foundation so content imagery—not platform chrome—carries visual personality.

Core visual language:

- graphite/ink background surfaces;
- soft white primary text;
- signal blue for primary interaction and active emphasis;
- red reserved for LIVE/urgent status semantics;
- content imagery may be warm, cool, vivid, documentary, cinematic, raw, or creator-specific;
- no global treatment should force every creator into a single accent palette;
- minimal chrome, generous spacing, content-first hierarchy;
- rounded geometry where it supports touch, media cards, sheets, and controls without becoming overly soft or playful.

Current design tokens already established in Figma include:

- base `#070A0F`;
- elevated `#0D1117`;
- card `#151B23`;
- text primary `#F8FAFC`;
- signal blue `#6D8CFF`;
- LIVE red `#FF4D5A`;
- success `#42D392`;
- warm optional accent `#F0A45D`.

Primary typeface: **Geist**.

## 4. Figma File Structure

The connected Starter plan limits the file to three pages. The entire product system must therefore remain organized inside exactly these pages:

1. `00 — Foundations`
2. `01 — Components`
3. `02 — Screens`

Do not create additional pages unless the plan tier changes and the user explicitly approves a file restructure.

### Foundations page

Contains:

- color primitives and semantic aliases;
- spacing and radius variables;
- typography hierarchy;
- elevation/effect styles;
- accessibility and contrast examples;
- responsive layout rules;
- motion principles;
- iOS/iPadOS 27 adaptation rules;
- desktop density and breakpoint guidance.

### Components page

Contains reusable component families and their important states, including:

- top navigation;
- mobile navigation/tab behavior;
- buttons;
- search;
- avatar/account access;
- video/live cards;
- creator cards;
- show cards;
- community cards;
- badges and category pills;
- player controls;
- progress/timeline controls;
- comment rows;
- chat rows;
- follow/subscribe controls;
- sheets;
- menus;
- alerts;
- dialogs;
- empty/error/private/restricted states;
- upload controls;
- creator analytics modules;
- monetization modules;
- moderation controls.

Reuse iOS/iPadOS 27 library components where native platform behavior is intended. Wrap or adapt them to NSCENE tokens instead of rebuilding native controls from scratch without reason.

### Screens page

Contains all product artboards, grouped into clearly named sections for:

- iPhone / iOS 27;
- iPad / iPadOS 27;
- Desktop;
- shared state references when needed.

## 5. Platform Strategy

The design is **platform-first, product-consistent**.

NSCENE should not be a web layout squeezed onto an iPhone. The information architecture and core actions remain consistent, but each platform uses its strongest interaction model.

### iPhone / iOS 27

Target approximately **28 major artboards**.

Use Apple conventions where they materially improve usability:

- safe-area-aware layouts;
- native navigation bars and title behavior where appropriate;
- Dynamic Type-compatible hierarchy;
- SF Symbols for system-standard iconography where appropriate;
- native sheets, context menus, confirmation dialogs, and share surfaces;
- native search conventions;
- system gestures and back behavior;
- media playback controls that feel native while preserving NSCENE identity;
- iOS 27 tab/navigation patterns for high-frequency destinations;
- clear separation between public browsing and identity-required actions.

Expected iPhone coverage:

1. Home
2. Live browse
3. Live player
4. Uploads browse
5. Standard watch/player
6. Clips feed
7. Clip detail / comments state
8. Shows browse
9. Show detail
10. Creators browse
11. Creator profile
12. Communities browse
13. Community detail
14. Search entry
15. Search results
16. Notifications
17. Library / personal hub
18. History
19. Watch later / saved
20. Playlist detail
21. Sign in
22. Account
23. Settings
24. Share / action sheet states
25. Report / moderation sheet states
26. Creator Studio home
27. Upload / publish flow
28. Go Live flow

Creator Studio sub-states such as analytics, monetization, moderation, stream setup, processing, and publishing may be represented as additional state artboards where needed without changing the platform target materially.

### iPad / iPadOS 27

Target approximately **14 major artboards**.

The iPad experience should not merely scale the phone UI. Use larger-screen behaviors such as:

- split navigation/content when useful;
- persistent secondary panels for comments, chat, queue, or creator data;
- multi-column browse grids;
- larger playback with adjacent metadata or conversation;
- Studio layouts that benefit from simultaneous preview + configuration;
- keyboard/pointer-friendly control density.

Expected iPad coverage centers on the highest-value views:

- Home;
- Live browse;
- Live player + chat;
- standard watch page;
- Clips browse/detail;
- Shows;
- Creator profile;
- Communities;
- Search;
- Library/history;
- Studio home;
- Upload/publish;
- Go Live;
- Analytics/moderation.

### Desktop web

Target approximately **18 major artboards**.

Desktop should exploit width and pointer interaction while preserving the NSCENE product model.

Expected coverage:

- Home;
- Live browse;
- Live player;
- Uploads;
- watch page;
- Clips;
- Shows;
- show detail;
- creators;
- creator profile;
- communities;
- community detail;
- search/results;
- library/history/saved;
- Studio dashboard;
- upload/publish;
- Go Live control room;
- analytics/monetization/moderation.

## 6. Navigation Model

The six public destinations remain the top-level content taxonomy:

`LIVE | UPLOADS | CLIPS | SHOWS | CREATORS | COMMUNITIES`

Desktop may show all six persistently.

On iPhone, high-frequency destinations may use native tab/navigation patterns, but the six destinations must remain discoverable and structurally intact. If all six do not fit comfortably in the primary tab surface, lower-frequency destinations may sit behind a native `More`/account/discovery surface rather than shrinking controls below comfortable touch sizes.

Signed-out users see **SIGN IN**.

Signed-in users see an account/avatar surface. Creator Studio and Account live under authenticated navigation, not the public primary nav.

## 7. Content Surfaces

### Home

Home is a curated entry point, not an algorithmic black box visually framed as objective truth. It should emphasize:

- active LIVE content;
- followed/known creators where permitted;
- trending or editorial clips;
- featured shows;
- creator discovery;
- communities;
- continuation surfaces such as watch later/history when signed in.

Recommendation/explanation affordances should be possible later without requiring a redesign.

### Live

Live requires the clearest real-time state treatment in the product:

- LIVE red reserved for active live status;
- viewer count and stream status clearly separated from decorative metadata;
- chat must not overpower the stream;
- reconnecting, ended, restricted, removed, and scheduled states must be designed;
- creator identity and follow action remain visible without obstructing playback.

### Uploads

Uploads represent standard long-form or uploaded video. This lane should support:

- browse;
- watch;
- creator attribution;
- chapters/timeline metadata where available;
- comments;
- playlists/collections;
- saving/sharing/reporting.

### Clips

Clips are short-form video but should remain visibly part of NSCENE rather than becoming a completely separate app shell.

Phone can use immersive vertical playback. Desktop/iPad should avoid giant phone emulation and instead use context-appropriate browsing/playback layouts.

### Shows

Shows are episodic/series content and require:

- show identity;
- seasons/episodes;
- progress state;
- follow/save behavior;
- clear distinction from creator uploads.

### Creators

Creator pages must support:

- identity;
- follow relationship;
- live status;
- uploads;
- clips;
- shows/playlists where applicable;
- community activity;
- about metadata;
- verified state when such verification exists.

### Communities

Communities are first-class destinations, not comment sections with a new label. Design for:

- community identity;
- membership/follow state;
- posts/media/events as applicable;
- moderation visibility;
- reporting;
- creator-owned and independent communities.

## 8. Watch and Player Model

Video playback is a core primitive across Live, Uploads, Clips, and Shows.

The player system must define:

- playing;
- paused;
- buffering;
- reconnecting;
- ended;
- unavailable;
- age/restriction gate;
- signed-out action gate where needed;
- captions;
- playback speed where applicable;
- quality selection where applicable;
- casting/AirPlay where platform permits;
- picture-in-picture where platform permits;
- full screen;
- queue/next-item behavior when applicable.

LIVE and uploaded video share foundational controls but must not blur their status semantics.

## 9. Creator Studio

Studio is a product area, not a single screen.

Minimum Studio coverage:

- dashboard;
- upload/publish;
- stream setup;
- live control room;
- content library;
- analytics overview;
- per-content analytics;
- audience metrics;
- monetization summary;
- moderation queue;
- comments/chat management;
- profile/channel settings.

The 60-artboard target does not require designing every administrative edge case. It requires enough breadth that all major Studio modules have a defined interaction and component model.

## 10. State and Integrity Rules

Designs must distinguish:

- verified production data;
- demo/mock data used only for design illustration;
- loading;
- empty;
- error;
- offline/reconnecting;
- unavailable;
- private;
- blocked/restricted;
- signed-out;
- permission-denied;
- moderation/removal.

No mock creator, viewer count, stream, or engagement value may be presented in engineering handoff as evidence that the production system contains that activity.

Design mockups may use illustrative names/numbers, but the Figma section or annotation should make clear that such content is illustrative.

## 11. Accessibility

The design system must support:

- WCAG-conscious contrast;
- Dynamic Type on iOS/iPadOS;
- comfortable touch targets;
- keyboard navigation on desktop and iPad where relevant;
- visible focus states;
- non-color-only LIVE/error/success semantics;
- captions/subtitle surfaces;
- readable player controls against variable media imagery;
- reduced-motion-safe transitions.

## 12. Responsive Rules

Do not create one-off layouts for every width.

Define reusable responsive behaviors for:

- navigation collapse/recomposition;
- browse grid column changes;
- media aspect ratios;
- player + metadata/chat arrangements;
- Studio multi-panel layouts;
- mobile sheets becoming desktop side panels/dialogs where appropriate.

Artboards are canonical examples of responsive families, not independent products.

## 13. Artboard Budget

Target total: **approximately 60 major artboards**.

Expected distribution:

- iPhone/iOS 27: ~28
- iPad/iPadOS 27: ~14
- Desktop: ~18

This is a planning target, not a requirement to manufacture exactly 60 frames. Add a state artboard when it removes genuine implementation ambiguity; do not add near-duplicate artboards merely to hit a number.

## 14. Existing Figma Work to Preserve

The official Figma file already contains:

- Foundations tokens and Geist text styles;
- action, status, spacing, and radius semantics;
- reusable Button, Nav Item, Badge, Search Field, Avatar, and Video Card components;
- canonical early desktop Home, Live Browse, Creator Profile designs;
- canonical early Mobile Home and Mobile Live Player designs.

These are starting assets, not immutable final layouts. They should be reconciled with the complete cross-platform system rather than discarded blindly.

## 15. Implementation Order

The design build should proceed in this order:

1. reconcile Foundations with iOS/iPadOS 27 requirements;
2. complete shared component families and native-platform wrappers;
3. complete iPhone core browse/watch/navigation flows;
4. complete iPhone identity and Studio flows;
5. adapt the proven system to iPadOS 27;
6. complete desktop product breadth;
7. add required edge/state artboards;
8. run cross-platform consistency, accessibility, naming, and component-binding QA;
9. update engineering handoff/spec references only after the Figma system passes review.

## 16. Non-Goals for This Design Pass

This pass does **not** require:

- copying YouTube branding or proprietary visual identity;
- cloning every YouTube settings page;
- inventing fake production activity;
- changing native bundle IDs or application identifiers;
- solving backend hosting, DNS, authentication configuration, or production dependency vulnerabilities;
- implementing all screens in application code during the Figma design phase.

## 17. Acceptance Criteria

The design phase is complete when:

- the three-page Figma file contains the agreed foundations, component system, and approximately 60 purposeful major artboards;
- iPhone screens demonstrably follow iOS 27-native interaction patterns where appropriate;
- iPad screens are genuine large-screen compositions, not enlarged phone frames;
- desktop screens cover the same product model at desktop density;
- the six public NSCENE destinations remain structurally intact;
- Studio is reachable only through authenticated product surfaces;
- all major playback, empty, loading, restricted, error, and signed-out states needed for implementation are represented or explicitly specified;
- repeated UI is represented as reusable components rather than manually duplicated primitives;
- accessibility and responsive behavior are documented sufficiently for engineering handoff;
- illustrative/mock content is clearly distinguishable from claims about real production data;
- a final visual and structural QA pass finds no known issue that blocks implementation planning.