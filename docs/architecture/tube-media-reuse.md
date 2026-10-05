# HALO Media Pipeline Reuse from HWetP

Date: 2026-10-04
Source repository: `DopestT/HWetP`
Target repository: `DopestT/HALO-Go-Live-Be-Seen`

## Decision

HALO will reuse proven **media-pipeline concepts** from HWetP, but it will not copy the adult-site product model or make the Node service a second HALO backend.

HALO remains Go/PostgreSQL/Redis first. Reusable HWetP behavior is ported behind HALO-owned domain interfaces and covered by HALO tests.

## Reuse immediately

1. **Source registry**
   - every imported/remote media source has a canonical HALO source record;
   - authorization state is explicit;
   - permitted media hosts are allowlisted per source.

2. **Secure media staging**
   - remote media and thumbnails must use HTTPS;
   - hosts must match the source-specific allowlist;
   - imported media enters `pending` moderation rather than becoming public immediately;
   - duplicate source/external IDs reconcile rather than create uncontrolled duplicates.

3. **Evidence fields**
   - rights/provenance references are durable metadata;
   - attribution metadata is preserved;
   - source authorization and rights evidence are evaluated before publication.

4. **Moderation state machine**
   - pending -> approved/rejected;
   - approved/rejected content can be blocked when required;
   - rejected/blocked content can be reopened to pending through an explicit action;
   - impossible transitions fail closed.

5. **Audited moderation**
   - privileged media actions require an attributable actor and reason;
   - updates and audit records are transactional;
   - audit records retain previous and new state.

6. **Public-output sanitization**
   - invalid or no-longer-approved remote URLs are never returned as usable public media targets;
   - provider/source metadata is separated from public media responses.

## HALO-specific extensions

HALO adds requirements that the tube pipeline did not need:

- live broadcast -> recording -> archive -> clip lineage;
- creator/channel ownership and organization roles;
- stream-key and publisher credential isolation;
- short-lived signed playback/upload credentials;
- malware/file-type validation for uploaded assets;
- decompression/transcoding resource limits;
- object-storage quarantine before publication;
- moderation/report linkage to live broadcasts and chat evidence;
- cryptographically strong IDs and opaque public identifiers;
- entitlement-aware playback where content is subscriber/member restricted;
- deletion/retention enforcement and exportability;
- append-oriented security/audit events suitable for incident response.

## Security boundary

Imported media is untrusted input even when it comes from an approved creator or provider.

HALO must never:

- fetch arbitrary URLs supplied by users;
- permit private/link-local/loopback destinations through media fetchers;
- render an imported URL solely because it parses;
- expose provider secrets, raw OAuth tokens, stream keys, storage credentials, or internal object paths;
- silently publish newly imported media;
- infer rights from possession of a URL;
- let provider identifiers become HALO primary keys.

Remote fetchers must enforce HTTPS, host allowlists, DNS/IP safety checks, response-size/time limits, redirect revalidation, MIME/content validation, and egress restrictions.

## Implementation mapping

- `backend/internal/media/` — source policy, media staging policy, archive/clip lineage.
- `backend/internal/moderation/` — audited transitions and enforcement.
- `backend/internal/streaming/` — live provider boundary and recording handoff.
- `backend/internal/audience/` — external audience identity imports only; never media rights inference.
- PostgreSQL — canonical durable records.
- Redis — ephemeral coordination only.
- object storage — quarantined and published media objects with separate namespaces/policies.

## Source behaviors being ported

Reference implementations in `DopestT/HWetP`:

- `server/scripts/stage-video.js`
- `server/src/mediaPolicy.js`
- `server/scripts/moderate-video.js`
- `server/scripts/register-source.js`
- `server/scripts/moderation-queue.js`
- `server/db/schema.sql`

These are behavioral references. HALO should reimplement the required semantics in its Go bounded domains instead of creating a runtime dependency on HWetP.
