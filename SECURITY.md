# Security Policy

HALO is being built as a high-assurance public live-video platform. Security reports are treated as operational incidents, not ordinary feature requests.

## Supported versions

Until the first public release, only the current production branch and the active release candidate are eligible for security fixes. After general availability, this file will list supported versions explicitly.

## Reporting a vulnerability

Do not open a public GitHub issue for a suspected vulnerability that could expose user data, authentication material, payment information, administrative access, stream-control credentials, infrastructure details, or an exploitable security weakness.

Use GitHub's private vulnerability-reporting/security-advisory mechanism for this repository when available. If private reporting is unavailable, contact the repository owner through a private verified channel rather than posting exploit details publicly.

A useful report includes:

- affected component and version/commit;
- impact and preconditions;
- concise reproduction steps;
- whether the issue has been actively exploited or publicly disclosed;
- logs/screenshots that do not contain unnecessary secrets or personal data;
- suggested remediation if known.

Do not include real user credentials, tokens, private user content, or destructive proof-of-concept data when a safer demonstration is possible.

## Response priorities

Security issues are triaged by demonstrated impact and exploitability. Active exploitation, authentication/authorization bypass, remote code execution, secret/key exposure, cross-tenant data access, payment/payout manipulation, administrative takeover, destructive data access, and critical availability flaws receive the highest priority.

Known-exploited or internet-exposed critical flaws may require emergency mitigations before a full code fix, including credential rotation, feature disablement, provider isolation, traffic controls, or temporary endpoint shutdown.

## Security requirements

The mandatory architecture and release requirements are documented in `docs/security/SECURITY_ARCHITECTURE.md`.

Key rules include:

- deny-by-default authorization and explicit object/function permission checks;
- phishing-resistant MFA for platform administrators before public launch;
- provider secrets never embedded in clients;
- short-lived, narrowly scoped stream/session credentials;
- protected private data stores and least-privilege service identities;
- dependency and vulnerability scanning in CI;
- append-oriented security audit events and centralized monitoring;
- tested backup/restore and credential/key revocation procedures;
- independent penetration testing before a high-profile launch.

## Safe research expectations

Good-faith research should minimize access to other people's data and avoid persistence, destructive actions, denial of service, social engineering, physical attacks, or disruption of live broadcasts. Stop testing once enough evidence exists to demonstrate the issue safely.

This policy does not grant permission to access systems, accounts, or data outside the reporter's authorization.
