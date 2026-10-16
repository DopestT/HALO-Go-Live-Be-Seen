# NSCENE Cross-Platform Product Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the official NSCENE Figma file into a production-ready cross-platform design system with approximately 60 purposeful major artboards spanning iPhone/iOS 27, iPadOS 27, and desktop.

**Architecture:** Keep one canonical product model across three Figma pages: Foundations, Components, and Screens. Build the system from shared semantic tokens and reusable NSCENE components, adopting iOS/iPadOS 27 native components and interaction patterns where platform-native behavior is materially better, then adapt proven patterns to iPad and desktop rather than creating unrelated platform designs.

**Tech Stack:** Figma Design, Figma Variables, Figma components/variants, iOS and iPadOS 27 Figma library, Geist typography, NSCENE semantic design tokens.

**Spec:** `docs/superpowers/specs/2026-10-15-nscene-cross-platform-product-design.md`

## Global Constraints

- The Figma file is `NSCENE — Official Product Design`: `https://www.figma.com/design/bhqX9v72yDySvySguvm1Qw`.
- The Starter plan limits the file to exactly three pages: `00 — Foundations`, `01 — Components`, `02 — Screens`.
- Public navigation remains exactly `LIVE | UPLOADS | CLIPS | SHOWS | CREATORS | COMMUNITIES`.
- Creator Studio is not public primary navigation; it is reached from authenticated account/avatar surfaces.
- Browsing remains public; authentication gates only identity-bound actions.
- NSCENE is not a black-and-gold brand. Use restrained dark neutral chrome, signal blue `#6D8CFF` for primary interaction, LIVE red `#FF4D5A`, soft white `#F8FAFC`, and content-led imagery.
- Primary typeface is Geist.
- iPhone and iPad layouts must follow iOS/iPadOS 27-native interaction conventions where appropriate, including safe areas, Dynamic Type-aware hierarchy, SF Symbols, native sheets/menus, search, gestures, player controls, and platform navigation.
- iPad layouts must be genuine large-screen compositions, not enlarged phone screens.
- Desktop layouts must preserve the same product model at desktop density.
- Repeated UI must be represented by reusable components or native library instances rather than manually duplicated primitives.
- Illustrative mock content must be clearly distinguishable from real production evidence.
- The target is approximately 60 major artboards: ~28 iPhone, ~14 iPad, ~18 desktop. Do not create duplicates solely to hit the number.
- Do not change native bundle IDs, backend hosting, DNS, authentication configuration, or production dependencies during this design build.

## Review Focus

- **Native-vs-custom ambiguity:** a native iOS/iPadOS control should remain native when changing it would reduce platform familiarity; NSCENE styling should wrap rather than visually replace standard behavior.
- **Responsive divergence:** the same destination must remain recognizably the same product on phone, tablet, and desktop while layout composition changes appropriately.
- **State integrity:** live, offline, ended, unavailable, private, restricted, signed-out, loading, and error states must be visually distinct and not rely on color alone.
- **Accessibility under media:** text/player controls placed over arbitrary creator imagery must remain readable and operable with Dynamic Type, focus, touch, keyboard, and reduced motion expectations.
- **Illustrative data:** names, viewers, engagement counts, and streams used in Figma must be visibly annotated as illustrative and never imply verified production activity.

---

### Task 1: Reconcile Foundations for iOS/iPadOS 27 and responsive behavior

**Files / surfaces:**
- Figma: `00 — Foundations`
- Reference: `docs/superpowers/specs/2026-10-15-nscene-cross-platform-product-design.md`

**Interfaces:**
- Consumes: existing NSCENE primitive/semantic variables, Geist text styles, current spacing/radius/elevation definitions.
- Produces: complete cross-platform foundation rules that every component and screen task consumes.

- [ ] **Step 1: Audit existing Foundations**
  - Read local variable collections, styles, and specimen frames.
  - Verify existing core values: base `#070A0F`, elevated `#0D1117`, card `#151B23`, text `#F8FAFC`, signal `#6D8CFF`, LIVE `#FF4D5A`, success `#42D392`.
  - Expected: no unexplained duplicate semantic tokens.

- [ ] **Step 2: Add iOS/iPadOS 27 adaptation guidance**
  - Add documented specimens for safe-area behavior, Dynamic Type scaling expectations, system material usage, native sheet/menu treatment, touch targets, SF Symbol use, reduced motion, and focus/keyboard behavior.
  - Expected: rules are explicit enough that a screen implementer can choose native vs custom treatment without inventing policy.

- [ ] **Step 3: Add responsive layout rules**
  - Define navigation recomposition, browse grid scaling, player + metadata/chat arrangements, mobile-sheet to desktop-panel transitions, and Studio multi-panel behavior.
  - Expected: phone, tablet, and desktop layouts can be derived from shared rules rather than one-off frame logic.

- [ ] **Step 4: Accessibility verification**
  - Structural check: all text styles use Geist and all core semantic variables have explicit scopes.
  - Visual check: key text/action combinations pass contrast inspection against base/elevated/card surfaces; LIVE is also labeled by text/icon, not color only.
  - Expected: no critical contrast or hierarchy defect remains.

- [ ] **Step 5: Save a Foundations QA note in the Figma file**
  - Record that any mock imagery/colors are illustrative and not product data.
  - Expected: downstream screen tasks inherit the integrity rule.

### Task 2: Complete the reusable NSCENE component system

**Files / surfaces:**
- Figma: `01 — Components`

**Interfaces:**
- Consumes: Task 1 variables/styles and the iOS/iPadOS 27 library already added to the file.
- Produces: reusable components for all subsequent artboards.

- [ ] **Step 1: Audit existing components**
  - Verify Button, Nav Item, Badge, Search Field, Avatar, and Video Card masters and variants.
  - Check bindings, typography, names, and transparent structural frames.
  - Expected: existing masters are reused or deliberately reconciled; no duplicate replacement without reason.

- [ ] **Step 2: Add core content components**
  - Build Creator Card, Show Card, Community Card, Playlist/Collection Card, Continue Watching row, and section header families.
  - Expected: each family has documented use and needed state variants.

- [ ] **Step 3: Add player and real-time components**
  - Build shared player controls, LIVE status, timeline/progress, captions/settings affordance, viewer/status metadata, chat row, reconnecting/ended/unavailable/restricted overlays.
  - Expected: LIVE and uploaded-video semantics share control foundations but remain status-distinct.

- [ ] **Step 4: Add social/action components**
  - Build comment row, reply state, follow/subscribe action, save/share/report actions, notification item, membership/join state, and moderation status.
  - Expected: signed-out actions have a defined gated state rather than silently acting authenticated.

- [ ] **Step 5: Add Creator Studio components**
  - Build upload drop/selection controls, publish fields, stream setup controls, analytics KPI cards/charts, moderation queue rows, monetization summary modules, and content-table/list rows.
  - Expected: Studio can be assembled without inventing a second design language.

- [ ] **Step 6: Wrap native iOS/iPadOS 27 controls**
  - Reuse native library patterns for tab/navigation bars, sheets, menus, alerts, search, segmented controls, toggles, and system dialogs where appropriate.
  - Bind/wrap with NSCENE semantics only where the platform pattern remains recognizable.
  - Expected: mobile screens feel native rather than web-styled.

- [ ] **Step 7: Component QA**
  - Structural check: repeated patterns on Screens can resolve to instances of these masters.
  - Visual check: components have no clipped labels, unintended white fills, low-contrast text, or detached variants.
  - Expected: component page is sufficient to construct the planned screen inventory.

### Task 3: Build iPhone/iOS 27 public browse and playback flows

**Files / surfaces:**
- Figma: `02 — Screens`, section `iPhone / iOS 27 — Public`

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces: the public, signed-out-capable iPhone product experience.

- [ ] **Step 1: Build canonical iPhone navigation shell**
  - Preserve all six public destinations while using iOS 27-appropriate high-frequency tab/navigation patterns.
  - Use a native More/discovery/account surface if all six should not occupy the primary tab bar.
  - Expected: no destination becomes structurally unreachable.

- [ ] **Step 2: Build browse destinations**
  - Create Home, Live Browse, Uploads Browse, Clips Feed, Shows Browse, Creators Browse, and Communities Browse.
  - Expected: each lane is visually distinct by content model but clearly part of one NSCENE app.

- [ ] **Step 3: Build playback/detail destinations**
  - Create Live Player, standard Watch/Player, Clip Detail/Comments, Show Detail, Creator Profile, Community Detail.
  - Expected: player/control behavior follows the component model and safe-area rules.

- [ ] **Step 4: Build search**
  - Create Search Entry and Search Results using native iOS search behavior.
  - Expected: results can represent creators, videos, clips, shows, and communities without separate search systems.

- [ ] **Step 5: Build critical playback states**
  - Add explicit references for buffering, reconnecting, ended, unavailable, restricted, signed-out-action gate, and captions/settings.
  - Expected: engineering does not need to infer failure behavior from a happy-path player.

- [ ] **Step 6: Public-flow QA**
  - Visual check all public iPhone frames at normal scale.
  - Structural check safe areas, touch sizes, native navigation components, and reusable NSCENE component instances.
  - Expected: no phone frame reads as a shrunk desktop page.

### Task 4: Build iPhone identity, library, account, and Creator Studio flows

**Files / surfaces:**
- Figma: `02 — Screens`, section `iPhone / iOS 27 — Identity & Studio`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: authenticated/personal iPhone product flows.

- [ ] **Step 1: Build identity/personal surfaces**
  - Create Sign In, Notifications, Personal Hub/Library, History, Watch Later/Saved, Playlist Detail, Account, Settings.
  - Expected: public browsing remains available without authentication; identity-bound actions lead to defined sign-in behavior.

- [ ] **Step 2: Build native action sheets**
  - Create Share/Action and Report/Moderation sheet states using iOS 27-native patterns.
  - Expected: destructive/report actions use clear confirmation semantics.

- [ ] **Step 3: Build Studio entry and dashboard**
  - Create Creator Studio Home reachable only from authenticated account/avatar navigation.
  - Expected: Studio is not added to the six public destinations.

- [ ] **Step 4: Build creator publishing flows**
  - Create Upload/Publish and Go Live flows, including processing/permission/error states that materially affect implementation.
  - Expected: no fake successful publication is implied by a mock state.

- [ ] **Step 5: Add Studio module references**
  - Represent analytics, monetization, moderation, content library, and profile/channel settings sufficiently to establish the component/interaction model.
  - Expected: the iPhone inventory lands near the planned ~28 major artboards without padding with duplicates.

- [ ] **Step 6: Authenticated-flow QA**
  - Verify account gating, Studio reachability, native sheets/menus, keyboard/Dynamic Type tolerance, and clear permission-denied states.
  - Expected: authenticated behavior is explicit and consistent with public flows.

### Task 5: Adapt the system to iPadOS 27

**Files / surfaces:**
- Figma: `02 — Screens`, section `iPad / iPadOS 27`

**Interfaces:**
- Consumes: proven iPhone product model plus Tasks 1–2 responsive/native rules.
- Produces: ~14 large-screen iPad compositions.

- [ ] **Step 1: Establish the iPad shell**
  - Use appropriate sidebar/split-view/navigation patterns instead of scaling the phone shell.
  - Expected: navigation takes advantage of width and pointer/keyboard use.

- [ ] **Step 2: Adapt core browse**
  - Create Home, Live Browse, Clips, Shows, Creator Profile, Communities, Search, Library/History.
  - Expected: multi-column content density and hierarchy remain readable at iPad scale.

- [ ] **Step 3: Adapt playback**
  - Create Live Player + Chat and standard Watch page with adjacent metadata/conversation where useful.
  - Expected: player does not imitate a giant portrait phone.

- [ ] **Step 4: Adapt Studio**
  - Create Studio Home, Upload/Publish, Go Live, and Analytics/Moderation with simultaneous preview + configuration where useful.
  - Expected: iPad Studio gains actual productivity value from the larger canvas.

- [ ] **Step 5: iPad QA**
  - Verify keyboard/pointer targets, split-view composition, safe areas, native controls, and Dynamic Type resilience.
  - Expected: approximately 14 purposeful major artboards with no enlarged-phone duplicates.

### Task 6: Complete desktop product breadth

**Files / surfaces:**
- Figma: `02 — Screens`, section `Desktop`

**Interfaces:**
- Consumes: Tasks 1–5 and existing desktop Home, Live Browse, Creator Profile starting assets.
- Produces: ~18 desktop artboards covering the same product model.

- [ ] **Step 1: Reconcile existing desktop starting screens**
  - Keep useful Home, Live Browse, and Creator Profile work; fix component or layout drift rather than rebuilding blindly.
  - Expected: existing approved direction is preserved where valid.

- [ ] **Step 2: Complete public desktop destinations**
  - Create/complete Uploads, standard Watch, Clips, Shows, Show Detail, Creators, Communities, Community Detail, Search/Results.
  - Expected: all six public destinations are persistent and fully represented.

- [ ] **Step 3: Complete personal desktop surfaces**
  - Create Library/History/Saved as a coherent personal area.
  - Expected: signed-out vs signed-in affordances remain explicit.

- [ ] **Step 4: Complete desktop Studio**
  - Create Dashboard, Upload/Publish, Go Live Control Room, and Analytics/Monetization/Moderation.
  - Expected: use desktop width for multi-panel productivity rather than stretched mobile forms.

- [ ] **Step 5: Desktop QA**
  - Verify grid density, readable player + metadata layouts, pointer focus/hover states, keyboard focus, and component reuse.
  - Expected: approximately 18 major desktop artboards, not counting trivial state overlays.

### Task 7: Add shared edge-state references and integrity annotations

**Files / surfaces:**
- Figma: `02 — Screens`, section `Shared States / Engineering Reference`

**Interfaces:**
- Consumes: Tasks 1–6.
- Produces: implementation-safe state coverage across platforms.

- [ ] **Step 1: Add state matrix**
  - Represent loading, empty, error, offline/reconnecting, unavailable, private, blocked/restricted, signed-out, permission-denied, moderation/removal.
  - Expected: each state names the destinations/components it applies to.

- [ ] **Step 2: Add player-state reference**
  - Show playing, paused, buffering, reconnecting, ended, unavailable, age/restriction, captions, speed, quality, casting/AirPlay, PiP, fullscreen, and queue/next behavior where applicable.
  - Expected: LIVE and uploaded-video differences are explicit.

- [ ] **Step 3: Add illustrative-data annotation convention**
  - Mark mock names, viewers, counts, streams, comments, and analytics as illustrative in the design handoff area.
  - Expected: no Figma mock is reasonably mistaken for verified production evidence.

### Task 8: Final structural, visual, accessibility, and inventory QA

**Files / surfaces:**
- Figma: all three pages
- Repo reference: spec + this plan only; no production app implementation in this task.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: reviewed Figma system ready for engineering implementation planning.

- [ ] **Step 1: Inventory major artboards**
  - Count purposeful major frames by platform.
  - Expected: approximately 28 iPhone, 14 iPad, 18 desktop; deviations are acceptable only when they remove ambiguity or avoid duplication.

- [ ] **Step 2: Component-reuse audit**
  - Inspect repeated UI across Screens.
  - Expected: recurring patterns are component instances or deliberate native library instances, not detached duplicated primitives.

- [ ] **Step 3: Navigation/auth audit**
  - Verify the six public destinations remain structurally intact and Studio remains authenticated-only.
  - Expected: signed-out browsing remains possible.

- [ ] **Step 4: Accessibility audit**
  - Check contrast, Dynamic Type tolerance, non-color-only status semantics, touch sizes, desktop/iPad keyboard focus, captions, and reduced-motion documentation.
  - Expected: no known accessibility defect blocks handoff.

- [ ] **Step 5: Visual QA**
  - Screenshot each coherent platform section at normal review scale; repair clipped/truncated/low-contrast/unintended-fill issues and recheck only affected outputs.
  - Expected: no known visual defect blocks implementation planning.

- [ ] **Step 6: Integrity QA**
  - Confirm illustrative/mock content is annotated and no frame claims real production activity.
  - Expected: handoff cannot confuse design illustration with production evidence.

- [ ] **Step 7: Record final Figma completion summary**
  - Record final artboard counts, component inventory, unresolved non-blocking limitations, and engineering handoff notes in the repo/design documentation.
  - Expected: design phase meets the spec acceptance criteria and is ready for the next engineering implementation plan.
