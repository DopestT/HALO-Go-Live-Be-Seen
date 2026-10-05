#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const allowed = new Map([
  [
    'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm',
    {
      expires: '2026-10-18T00:00:00Z',
      reason:
        'Unpatched braces stack-exhaustion advisory reached through Metro/Jest build tooling. No user-controlled glob patterns are accepted by HALO runtime.',
    },
  ],
  [
    'https://github.com/advisories/GHSA-86w9-cpqp-85rv',
    {
      expires: '2026-10-18T00:00:00Z',
      reason:
        'Unpatched node-forge RSA verification advisory reached through Expo build/code-signing tooling. HALO does not ship Expo CLI in the application runtime and does not accept untrusted certificate material in the app.',
    },
  ],
]);

let raw;
try {
  raw = execFileSync('npm', ['audit', '--json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (error) {
  // npm audit exits non-zero when findings exist; its JSON remains authoritative.
  raw = error.stdout?.toString() ?? '';
  if (!raw.trim()) {
    process.stderr.write(error.stderr?.toString() ?? 'npm audit failed without JSON output\n');
    process.exit(2);
  }
}

let report;
try {
  report = JSON.parse(raw);
} catch {
  console.error('Could not parse npm audit JSON.');
  process.exit(2);
}

const vulnerabilities = report.vulnerabilities ?? {};
const now = Date.now();
const advisories = new Map();

// npm assigns an aggregate severity to packages that depend on vulnerable
// packages. That aggregate is not itself a separate advisory. Evaluate the
// concrete advisory objects instead so dependency cycles and transitive package
// severity cannot manufacture false high/critical findings.
for (const [packageName, vuln] of Object.entries(vulnerabilities)) {
  for (const via of vuln.via ?? []) {
    if (!via || typeof via !== 'object') continue;
    const severity = String(via.severity ?? '').toLowerCase();
    if (!['high', 'critical'].includes(severity)) continue;

    const key = via.url ?? `${packageName}:${via.source ?? via.title ?? via.range ?? 'unknown'}`;
    if (!advisories.has(key)) {
      advisories.set(key, {
        packageName,
        severity,
        url: via.url,
        title: via.title,
        range: via.range,
      });
    }
  }
}

const blocked = [];
const waived = new Map();

for (const [key, advisory] of advisories) {
  const exception = advisory.url ? allowed.get(advisory.url) : undefined;
  if (!exception) {
    blocked.push(
      `${advisory.packageName}: ${advisory.severity} ${advisory.url ?? advisory.title ?? advisory.range ?? key}`,
    );
    continue;
  }

  const expiry = Date.parse(exception.expires);
  if (!Number.isFinite(expiry) || now >= expiry) {
    blocked.push(`${advisory.packageName}: temporary exception expired for ${advisory.url}`);
    continue;
  }

  waived.set(advisory.url, exception);
}

if (blocked.length > 0) {
  console.error('Unapproved high/critical npm audit advisories:');
  for (const finding of [...new Set(blocked)].sort()) console.error(`- ${finding}`);
  process.exit(1);
}

if (waived.size > 0) {
  console.warn('Temporary, exact advisory exceptions in effect:');
  for (const [url, exception] of waived) {
    console.warn(`- ${url} — expires ${exception.expires}`);
    console.warn(`  ${exception.reason}`);
  }
}

const metadata = report.metadata?.vulnerabilities ?? {};
console.log(
  `npm advisory policy passed: direct high/critical advisories=${advisories.size}; aggregate package counts critical=${metadata.critical ?? 0}, high=${metadata.high ?? 0}, moderate=${metadata.moderate ?? 0}.`,
);
