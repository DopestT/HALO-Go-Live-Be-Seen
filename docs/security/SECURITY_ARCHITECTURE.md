# HALO High-Assurance Security Architecture

Status: mandatory architecture and release requirements
Date: 2026-10-04

HALO is designed as a high-value public communications platform and must assume it will attract sophisticated, persistent attackers. No internet-facing system can be guaranteed attack-proof; the requirement is defense in depth, containment, rapid detection, revocation, recovery, and continuous verification under hostile conditions.

## Assurance target

- OWASP ASVS 5.0 Level 2 is the minimum for every public application and API surface.
- OWASP ASVS 5.0 Level 3 treatment is required for authentication, privileged/admin operations, payout and entitlement control, stream-control credentials, audience-import identities/tokens, cryptographic key handling, and internal service trust.
- OWASP API Security Top 10 risks are explicit threat-model inputs, especially object/function authorization, broken authentication, unrestricted resource consumption, SSRF, security misconfiguration, inventory drift, and unsafe consumption of third-party APIs.
- Development and release processes follow NIST SSDF principles and CISA Secure-by-Design guidance.

## Threat model

Assume attacks from:

- credential-stuffing and account-takeover botnets;
- financially motivated criminal groups;
- coordinated harassment and abuse campaigns;
- skilled application/API attackers;
- compromised creator/moderator accounts;
- malicious or compromised third-party providers;
- software supply-chain compromise;
- malicious insiders and stolen administrator credentials;
- large volumetric and application-layer denial-of-service attacks;
- targeted, persistent actors willing to spend significant time and resources.

The design must not rely on attackers being unsophisticated.

## Security invariants

1. Compromise of one public service must not yield database, Redis, control-plane, signing-key, or cloud-admin compromise.
2. Compromise of one creator, moderator, or organization account must not grant platform administration or another tenant's data.
3. Provider compromise must not silently rewrite HALO canonical state.
4. A leaked stream credential must be rapidly revocable and narrowly scoped.
5. A leaked application token must have bounded lifetime, bounded privileges, and auditable use.
6. Attack traffic must not create unbounded provider spend, background jobs, emails, SMS, recordings, or database growth.
7. Security-sensitive state changes must be attributable to an authenticated actor and retained in tamper-resistant audit records.
8. Recovery from credential/key compromise and destructive data events must be practiced, not theoretical.

## Edge and DDoS architecture

- Public HTTP/API traffic terminates at a DDoS-protected edge/CDN/WAF layer.
- Production application origins are not directly exposed to the public internet where avoidable; origin access is restricted to approved edge/service networks.
- Media ingest, media playback, public API, web application, and administrative control planes are separated so saturation of one plane does not automatically exhaust the others.
- Layer 7 limits exist by IP, account, device/session, endpoint, organization, and risk class where appropriate.
- Expensive operations have concurrency ceilings, request-size ceilings, execution deadlines, queue limits, backpressure, and circuit breakers.
- Anonymous traffic receives tighter resource budgets than authenticated traffic.
- Provider calls that incur cost have explicit per-user/per-org and global spend/rate ceilings.
- Degraded modes preserve viewing/status pages and moderation/control capabilities where possible while disabling nonessential expensive features.

## Identity and privileged access

- Platform administrators use separate privileged identities from ordinary viewer/creator identities.
- Phishing-resistant FIDO2/WebAuthn/passkey authentication is mandatory for platform administrators and other high-impact privileged roles before production launch.
- Step-up authentication is required for payout destination changes, role/ownership changes, stream-key generation/rotation, API credential creation, security-setting changes, and sensitive exports.
- Sessions are short-lived according to role risk; refresh credentials rotate and replay is detected/revoked.
- Password-only authentication is never sufficient for privileged administration.
- Account recovery is treated as an authentication path with controls at least as strong as normal login.
- Privileged/admin interfaces are protected behind an identity-aware access layer and are not treated as ordinary public endpoints.
- Emergency/break-glass accounts are few, separately secured, continuously monitored, and their use generates a high-severity event.

## Authorization

- Authorization is deny-by-default.
- Every object access performs object-level authorization; possession of a UUID or provider identifier is never authorization.
- Every privileged function performs explicit function-level authorization.
- Writable fields are allowlisted to prevent mass-assignment/property-level authorization failures.
- Tenant/channel/organization ownership boundaries are enforced in the service layer and, where practical, reinforced with PostgreSQL row-level security or equivalent database controls.
- Roles are capability-based and least-privilege: owner, administrator, broadcaster, moderator, editor, analyst, viewer are not interchangeable.
- Sensitive authorization decisions are logged without logging secret values.

## Streaming credential security

- LiveKit or future provider credentials are issued by trusted backend services only; provider secrets never ship in web/mobile clients.
- Viewer and publisher credentials are short-lived, room/session scoped, and grant only required permissions.
- OBS/ingest stream keys are high-entropy secrets, stored only as protected/verifier material where provider workflows permit, revocable individually, and rotatable without changing the public channel identity.
- Stream-control operations require both HALO authorization and provider-session ownership checks.
- A global kill switch can revoke/disable provider issuance during an incident without corrupting durable broadcast records.

## API and input security

- All untrusted input is structurally and semantically validated at the trusted server layer.
- Parameterized database queries are mandatory.
- JSON/body depth, size, collection length, pagination, upload, and decompression limits are explicit.
- Remote URLs are never fetched directly from arbitrary user input; outbound fetch functionality uses allowlists, DNS/IP validation, redirect limits, private-address blocking, timeouts, and response-size limits to resist SSRF.
- CORS is explicit and production wildcard origins are prohibited for credentialed endpoints.
- CSRF protection is required for cookie-authenticated state changes.
- Error responses do not expose stack traces, secrets, provider tokens, database details, or internal network topology.
- Idempotency keys are required on payment/provider webhook processing and other retry-prone high-impact operations.

## Third-party/provider trust

- Responses from LiveKit, Stripe, Twitch, YouTube, Patreon, email providers, and any future provider are treated as untrusted input.
- OAuth tokens are encrypted at rest with separately managed keys and have the narrowest practical scopes.
- Webhooks use provider authentication/signature verification, replay protection, timestamp windows where available, and idempotent processing.
- Provider outages and malformed responses cannot mutate canonical HALO state into impossible lifecycle states.
- Provider adapters have timeouts, retry budgets with jitter, circuit breakers, and failure isolation.
- Egress from backend workloads is restricted to required destinations where infrastructure permits.

## Secrets and cryptography

- No production secrets in source code, mobile/web bundles, images, logs, tickets, or documentation.
- Production secrets are supplied at runtime from a managed secret/KMS system and are scoped per service/environment.
- Key rotation is designed in from the start; a single static shared secret must not authenticate the entire platform.
- Encryption is required in transit for public and internal service communication; insecure fallback is prohibited.
- Sensitive stored data and backups are encrypted at rest, with key access separated from data access.
- Cryptography uses vetted platform/library implementations rather than custom algorithms.
- Key and token identifiers may be logged; secret material must never be logged.

## Data-plane isolation

- PostgreSQL and Redis are private services with no unauthenticated public exposure.
- Redis is never considered a durable source of truth.
- Application services use separate least-privilege database/service identities.
- Administrative database access is separated from application runtime credentials.
- Production, staging, and development credentials/data stores are isolated.
- Sensitive production datasets are not copied into lower environments without an explicit sanitization process.

## Audit, detection, and response

- Authentication successes/failures, failed authorization, privilege changes, security-setting changes, payout changes, stream-key operations, moderation actions, provider-token changes, data exports, and administrative operations are security events.
- Security logs use UTC, stable event types, request/correlation IDs, actor IDs, target IDs, source metadata, and outcome fields.
- Secrets and sensitive message/content bodies are excluded from security logs unless a documented evidence-capture flow requires them.
- High-value audit streams are shipped off the application host to centralized storage; privileged audit records should be tamper-evident/append-oriented.
- Alerting exists for credential-stuffing patterns, impossible privilege transitions, abnormal token issuance, mass export, payout changes, unusual moderator/admin actions, webhook signature failures, and resource-exhaustion patterns.
- Incident response includes tested procedures to revoke sessions, OAuth tokens, stream keys, provider credentials, signing keys, and privileged accounts.

## Supply-chain security

- Lockfiles are authoritative and CI uses reproducible install commands (`npm ci`, Go module checks).
- GitHub Actions dependencies should be pinned to immutable commit SHAs for production workflows after verification.
- JavaScript, Go, GitHub Actions, and container dependencies are continuously inventoried and scanned.
- High/critical exploitable dependency findings block release unless a documented risk acceptance exists.
- CodeQL/security static analysis runs on pull requests.
- Dependency-review and automated dependency-update workflows are enabled.
- Build/release provenance and SBOM generation are required before general availability.
- Production images run minimal software and omit development/test tooling.

## Infrastructure/runtime hardening

- Containers/processes run as non-root wherever possible with minimal filesystem and Linux capabilities.
- Network paths follow least privilege; databases/caches/internal administration are not general internet services.
- Service-to-service trust uses individual identities and short-lived/certificate-based credentials rather than shared permanent passwords.
- Cloud/IaaS administrative access requires phishing-resistant MFA and least-privilege roles.
- Production configuration disables debug endpoints, sample code, development consoles, default credentials, and unused services.
- Configuration changes are auditable and preferably made through reviewed infrastructure-as-code.

## Availability and abuse resistance

- Chat, follows, invitations, uploads, searches, account creation, password/reset flows, OAuth linking, clip creation, stream creation, and reporting each have abuse-specific quotas.
- Rate limiting must avoid enabling attackers to permanently lock legitimate users out.
- Work queues are bounded and support per-tenant fairness so one abusive tenant cannot starve all others.
- Uploaded/recorded media processing is isolated from the API control plane.
- Untrusted media/file parsing occurs in isolated workers with resource limits.

## Backup and destructive-event recovery

- Encrypted backups are automated and include off-system/off-account or immutability protections appropriate to the infrastructure.
- Database and object-storage restore drills are exercised in staging before public beta and regularly thereafter.
- Recovery procedures include ransomware/destructive-admin scenarios, not only accidental deletion.
- Audit/security logs and backup credentials are protected from the same administrative blast radius as primary application data where practical.

## Mandatory security verification before public beta

Public beta is blocked until:

1. Threat model and data-flow review are complete.
2. Public API and authentication paths meet ASVS L2 requirements relevant to HALO.
3. Privileged/control-plane paths meet the selected ASVS L3 requirements relevant to HALO.
4. Phishing-resistant MFA is enforced for platform administrators.
5. Object/function authorization tests cover cross-user, cross-channel, and cross-organization access attempts.
6. Rate/resource-exhaustion tests cover expensive endpoints and background jobs.
7. SSRF tests cover all server-side URL-fetch/provider callback paths.
8. Webhook signature/replay/idempotency tests pass.
9. Dependency and CodeQL security gates pass or have explicit reviewed risk acceptance.
10. A staging DDoS/load exercise demonstrates graceful degradation and control-plane survival within defined capacity.
11. Backup/restore and key/session/token revocation drills are exercised.
12. An independent penetration test/red-team review is completed before a high-profile launch, with critical/high findings remediated or explicitly blocked from release.

## Operational principle

HALO security is a continuously measured operating function. Passing one audit does not make the platform secure; controls must remain observable, tested, patchable, and revocable as the product and threat landscape change.
