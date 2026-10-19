# NSCENE build-tool advisory mitigations

Reviewed 2026-10-18 against the committed root dependency tree. The production
build stopped because the prior exact advisory exceptions expired at midnight
UTC. Both upstream advisories still list no patched release as of this review.

## Scope and implementation

| Advisory | Locked dependency path | Local mitigation |
| --- | --- | --- |
| [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | Jest → micromatch 4.0.8 → braces 3.0.3 | Reject parser brace/parenthesis nesting above 128 before recursive walkers receive the AST. |
| [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | Expo 57.0.26 → @expo/cli 57.0.27 → node-forge 1.4.0; also @expo/code-signing-certificates 0.0.6 | Backport the nested DigestAlgorithm element-count check proposed in [upstream PR 1152](https://github.com/digitalbazaar/forge/pull/1152). This upstream PR is unmerged; this repository owns the local backport. |

The braces guard addresses parser-created ASTs and bounds both brace and
parenthesis blocks. It does not claim to make arbitrary caller-supplied ASTs or
all untrusted regular expressions safe. The current application source does not
import either package directly.

`npm ci` runs `scripts/dependency-mitigations.mjs --apply` as the root postinstall
step. It accepts only the exact locked versions and pristine SHA-256 file hashes,
applies the small patches and verifies the expected result hashes. Running it
again accepts the already-patched hashes. Unknown source, upgrades and extra
nested lockfile copies fail closed and require review.

`npm run verify` checks those hashes before the security regression tests, existing
app tests and TypeScript checks. `scripts/security-audit-policy.mjs` independently
verifies them before recognizing these two advisory mitigations. Unrelated
high/critical advisories remain blocking, as do invalid audit responses. Install
scripts disabled with `--ignore-scripts` leave pristine sources that fail
verification; the gate does not patch sources itself.

Registry URLs, package versions and tarball integrity values are unchanged. Raw
`npm audit` continues to report the upstream advisories. A policy pass means the
two installed local mitigations were verified, not that npm reports zero findings
or that upstream has published fixes. No date-based waiver is renewed.

## Validation and release boundary

- Regression tests first failed on six malicious-pattern/signature cases against
  the pristine packages, while the valid-pattern/signature cases passed.
- `npm run test:security` covers normal expansion, the depth boundary, escaped
  braces, malformed nested algorithm children, valid SHA-256 signatures with
  NULL/omitted parameters, repeated installation, unpatched/tampered sources,
  version changes, duplicate locked copies, unrelated advisories and audit errors.
- Run `npm ci --legacy-peer-deps`, `npm run verify`, `npm run build`,
  `node scripts/security-audit-policy.mjs` and `npm audit signatures` before
  considering this branch for merge. Record actual results in the PR.

These patches cover the root project dependency tree only. The legacy
`halo-app/` package and separately downloaded EAS CLI tooling are outside this
patch manifest. A successful web export is not an iOS/Android signing or EAS
production build result. Expo token authentication remains unverified until the
production workflow reaches that step. This branch does not change workflow
publication behavior or production DNS.

## Removal

When official fixed versions are published, update the compatible parent
dependencies and lockfile, remove each corresponding patch/recognition entry,
and rerun the regression tests, app verification, web export and security gates.
Do not change version strings to hide an advisory. Do not add a new exception
when the exact source/version checks reject an upgrade.
