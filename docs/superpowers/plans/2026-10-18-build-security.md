# NSCENE Build Security Implementation Plan

**Goal:** Restore build eligibility with verified mitigations for the two unpatched tooling advisories.

**Architecture:** Apply small, deterministic patches to the exact locked npm sources during installation. The audit gate accepts the two advisory IDs only after verifying the installed versions and patched file hashes. Other high/critical findings remain blocking.

**Tech stack:** Node.js, npm lifecycle scripts, node:test, existing Jest/TypeScript verification.

## Constraints

- Preserve npm registry packages, lockfile integrity values and upstream package versions.
- Keep application behavior and Expo/React Native versions unchanged.
- Do not extend date-based exceptions or merge to main during preparation.
- Treat the forge change as a local backport of unmerged upstream PR 1152.

## Tasks

- [x] Reproduce the expired audit gate and establish the 88-test/TypeScript baseline.
- [x] Add failing regressions for deeply nested braces/parentheses and surplus nested DigestAlgorithm children, plus valid glob/signature cases.
- [x] Implement exact-version, exact-hash install patches; reject unknown sources and verify idempotence/tamper detection.
- [x] Require patched-source verification before recognizing the two advisory mitigations; retain blocking behavior for all other high/critical advisories.
- [x] Run clean npm installation, regression tests, existing verification, web export, audit policy and registry signatures.
- [ ] Publish a draft PR with the precise validation results and remaining Expo authentication/build gate.

## Review focus

- Escaped braces and normal brace expansion remain supported.
- Both braces and parenthesis nesting have the same bounded depth.
- Valid RSA signatures with NULL or omitted parameters still verify.
- Installation with scripts disabled, changed versions, or modified source fails verification.
- Raw npm audit still lists the upstream advisories: local mitigation is not an upstream fixed release.
