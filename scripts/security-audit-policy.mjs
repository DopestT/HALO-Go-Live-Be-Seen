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
const advisoryCache = new Map();

function directAdvisories(name, seen = new Set()) {
  if (advisoryCache.has(name)) return advisoryCache.get(name);
  if (seen.has(name)) return [];
  seen.add(name);

  const vuln = vulnerabilities[name];
  if (!vuln) return [];

  const found = [];
  for (const via of vuln.via ?? []) {
    if (typeof via === 'string') {
      found.push(...directAdvisories(via, new Set(seen)));
      continue;
    }
    if (via && typeof via === 'object') {
      found.push(via);
    }
  }
  advisoryCache.set(name, found);
  return found;
}

const blocked = [];
const waived = new Map();

for (const [name, vuln] of Object.entries(vulnerabilities)) {
  if (!['high', 'critical'].includes(vuln.severity)) continue;

  const advisories = directAdvisories(name);
  if (advisories.length === 0) {
    blocked.push(`${name}: ${vuln.severity} finding has no resolvable advisory root`);
    continue;
  }

  for (const advisory of advisories) {
    const url = advisory.url;
    const exception = allowed.get(url);
    if (!exception) {
      blocked.push(`${name}: ${advisory.severity ?? vuln.severity} ${url ?? advisory.title ?? 'unknown advisory'}`);
      continue;
    }

    const expiry = Date.parse(exception.expires);
    if (!Number.isFinite(expiry) || now >= expiry) {
      blocked.push(`${name}: temporary exception expired for ${url}`);
      continue;
    }

    waived.set(url, exception);
  }
}

if (blocked.length > 0) {
  console.error('Unapproved high/critical npm audit findings:');
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
  `npm audit policy passed: critical=${metadata.critical ?? 0}, high=${metadata.high ?? 0}, moderate=${metadata.moderate ?? 0}.`,
);
