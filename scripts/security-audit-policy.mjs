#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mitigations, verifyMitigations } from './dependency-mitigations.mjs';

try {
  verifyMitigations();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
const mitigated = new Map(mitigations.map(mitigation => [mitigation.advisory, mitigation]));

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

if (report.error || !report.vulnerabilities || typeof report.vulnerabilities !== 'object' ||
  Array.isArray(report.vulnerabilities) || report.auditReportVersion !== 2) {
  console.error('npm audit did not return a valid version 2 vulnerability report.');
  process.exit(2);
}
const vulnerabilities = report.vulnerabilities;
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
const verified = new Map();

for (const [key, advisory] of advisories) {
  const mitigation = advisory.url ? mitigated.get(advisory.url) : undefined;
  if (!mitigation || advisory.packageName !== mitigation.packageName) {
    blocked.push(
      `${advisory.packageName}: ${advisory.severity} ${advisory.url ?? advisory.title ?? advisory.range ?? key}`,
    );
    continue;
  }

  verified.set(advisory.url, mitigation);
}

if (blocked.length > 0) {
  console.error('Unapproved high/critical npm audit advisories:');
  for (const finding of [...new Set(blocked)].sort()) console.error(`- ${finding}`);
  process.exit(1);
}

if (verified.size > 0) {
  console.warn('Upstream advisories remain; exact installed local mitigations verified:');
  for (const [url, mitigation] of verified) {
    console.warn(`- ${url} — ${mitigation.packageName}@${mitigation.version}`);
    console.warn(`  ${mitigation.reason}`);
  }
}

const metadata = report.metadata?.vulnerabilities ?? {};
console.log(
  `npm advisory policy passed: direct high/critical advisories=${advisories.size}; aggregate package counts critical=${metadata.critical ?? 0}, high=${metadata.high ?? 0}, moderate=${metadata.moderate ?? 0}.`,
);
