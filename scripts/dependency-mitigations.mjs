#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = value => createHash('sha256').update(value).digest('hex');

// Versions and source hashes intentionally require review when npm updates.
// Registry tarballs and their lockfile integrity values remain unchanged.
export const mitigations = [
  {
    packageName: 'braces', version: '3.0.3', file: 'lib/parse.js',
    advisory: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm',
    source: 'https://github.com/micromatch/braces/issues/70',
    reason: 'Local parser guard rejects brace/parenthesis nesting above 128 before recursive walkers run.',
    pristine: 'e572166565f15fa6ad9865ae49d678218e32aabfd1b3720f6d0d43d39800d310',
    patched: 'a079231da7887b68707c23241285affdee8e06b9619fe6a78ef5cbc0f0e6461d',
    occurrences: 2,
    before: '      stack.push(block);',
    after: "      if (stack.length > 128) {\n        throw new SyntaxError('HALO: brace pattern exceeds max nesting depth (128)');\n      }\n      stack.push(block);",
  },
  {
    packageName: 'node-forge', version: '1.4.0', file: 'lib/rsa.js',
    advisory: 'https://github.com/advisories/GHSA-86w9-cpqp-85rv',
    source: 'https://github.com/digitalbazaar/forge/pull/1152',
    reason: 'Local backport rejects surplus nested DigestAlgorithm elements; upstream PR 1152 is not yet merged/released.',
    pristine: 'fd4740238145ec26470eb3f06a627c72039538ce1307dbdce40521f94dfd0a50',
    patched: 'c9b1e3799e230528b6d6815c1f6cd3c6058b9d45975264b55d995abb976589af',
    occurrences: 1,
    before: '            obj.value.length !== 2) {',
    after: "            obj.value.length !== 2 ||\n            obj.value[0].value.length !==\n              (('parameters' in capture) ? 2 : 1)) {",
  },
];

function verifyLockedVersions(root) {
  const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
  for (const mitigation of mitigations) {
    const expected = `node_modules/${mitigation.packageName}`;
    const copies = Object.entries(lock.packages ?? {}).filter(([path]) =>
      path === expected || path.endsWith(`/${expected}`));
    if (copies.length !== 1 || copies[0][0] !== expected || copies[0][1].version !== mitigation.version) {
      throw new Error(`${mitigation.packageName}: unexpected locked copies or version; review every installed copy before accepting mitigation.`);
    }
  }
}

function installedFile(root, mitigation) {
  const base = join(root, 'node_modules', mitigation.packageName);
  const { version } = JSON.parse(readFileSync(join(base, 'package.json'), 'utf8'));
  if (version !== mitigation.version) {
    throw new Error(`${mitigation.packageName}: expected ${mitigation.version}, found ${version}; review mitigation before upgrading.`);
  }
  return join(base, mitigation.file);
}

export function applyMitigations(root = projectRoot) {
  verifyLockedVersions(root);
  for (const mitigation of mitigations) {
    const file = installedFile(root, mitigation);
    const source = readFileSync(file, 'utf8');
    const current = sha256(source);
    if (current === mitigation.patched) continue;
    if (current !== mitigation.pristine) {
      throw new Error(`${mitigation.packageName}: unrecognized source; refusing to patch.`);
    }
    if (source.split(mitigation.before).length - 1 !== mitigation.occurrences) {
      throw new Error(`${mitigation.packageName}: unexpected patch location count.`);
    }
    const patched = source.replaceAll(mitigation.before, mitigation.after);
    if (sha256(patched) !== mitigation.patched) {
      throw new Error(`${mitigation.packageName}: patched source hash mismatch.`);
    }
    writeFileSync(file, patched);
  }
  verifyMitigations(root);
}

export function verifyMitigations(root = projectRoot) {
  verifyLockedVersions(root);
  for (const mitigation of mitigations) {
    const file = installedFile(root, mitigation);
    if (sha256(readFileSync(file)) !== mitigation.patched) {
      throw new Error(`${mitigation.packageName}: required security mitigation missing or modified. Run npm ci with install scripts enabled.`);
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === '--apply') applyMitigations();
    else verifyMitigations();
    console.log('Verified exact installed build-tool security mitigations.');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
