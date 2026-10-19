const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generateKeyPairSync } = require('node:crypto');
const braces = require('braces');
const forge = require('node-forge');
const { mkdtempSync, cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { tmpdir } = require('node:os');
const { spawnSync } = require('node:child_process');

for (const [open, close] of [['{', '}'], ['(', ')']]) {
  for (const expand of [false, true]) {
    test(`rejects nesting above 128 for ${open}${close}, expand=${expand}`, () => {
      assert.throws(
        () => braces(open.repeat(129) + 'a,b' + close.repeat(129), { expand }),
        { name: 'SyntaxError', message: /max nesting depth/ },
      );
    });
  }
}

test('supports ordinary globs, nesting at the boundary, and escaped braces', () => {
  assert.deepEqual(braces('src/{one,two}/**/*.{ts,tsx}', { expand: true }), [
    'src/one/**/*.ts', 'src/one/**/*.tsx', 'src/two/**/*.ts', 'src/two/**/*.tsx',
  ]);
  assert.doesNotThrow(() => braces('{'.repeat(128) + 'a,b' + '}'.repeat(128)));
  assert.doesNotThrow(() => braces('\\{'.repeat(200)));
});

const pair = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicExponent: 65537,
  privateKeyEncoding: { format: 'pem', type: 'pkcs1' },
  publicKeyEncoding: { format: 'pem', type: 'pkcs1' },
});
const privateKey = forge.pki.privateKeyFromPem(pair.privateKey);
const publicKey = forge.pki.publicKeyFromPem(pair.publicKey);
const asn1 = forge.asn1;
const digest = forge.md.sha256.create().update('NSCENE build-tool regression').digest().getBytes();

// Construct a real, signed PKCS#1 DigestInfo. Only the algorithm structure varies.
// The vulnerable verifier accepts the surplus nested child despite signing the
// same digest. No RSA verification function is mocked.
function signature({ nullParameters, extraChild }) {
  const algorithm = [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false,
    asn1.oidToDer(forge.oids.sha256).getBytes())];
  if (nullParameters) algorithm.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, ''));
  if (extraChild) algorithm.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, 'unconsumed'));
  const info = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, algorithm),
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, digest),
  ]);
  return privateKey.sign(asn1.toDer(info).getBytes(), 'NONE');
}

for (const nullParameters of [true, false]) {
  test(`rejects surplus DigestAlgorithm child; NULL parameters=${nullParameters}`, () => {
    assert.throws(() => publicKey.verify(digest, signature({ nullParameters, extraChild: true })),
      /does not contain a valid RSASSA-PKCS1-v1_5 DigestInfo/);
  });
  test(`accepts valid DigestAlgorithm; NULL parameters=${nullParameters}`, () => {
    assert.equal(publicKey.verify(digest, signature({ nullParameters, extraChild: false })), true);
  });
}

test('install patches are idempotent and reject unpatched, tampered and upgraded sources', async t => {
  const { applyMitigations, verifyMitigations, mitigations } = await import('./dependency-mitigations.mjs');
  const root = mkdtempSync(join(tmpdir(), 'nscene-mitigations-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  cpSync(resolve(__dirname, '../package-lock.json'), join(root, 'package-lock.json'));
  for (const mitigation of mitigations) {
    const target = join(root, 'node_modules', mitigation.packageName);
    mkdirSync(join(target, 'lib'), { recursive: true });
    cpSync(require.resolve(`${mitigation.packageName}/package.json`), join(target, 'package.json'));
    cpSync(require.resolve(`${mitigation.packageName}/${mitigation.file}`), join(target, mitigation.file));
  }
  assert.doesNotThrow(() => applyMitigations(root));
  assert.doesNotThrow(() => applyMitigations(root));
  for (const mitigation of mitigations) {
    const file = join(root, 'node_modules', mitigation.packageName, mitigation.file);
    const source = readFileSync(file, 'utf8');
    // Restore the exact pristine npm source to simulate --ignore-scripts.
    writeFileSync(file, source.replaceAll(mitigation.after, mitigation.before));
    assert.throws(() => verifyMitigations(root), /mitigation missing or modified/);
    assert.doesNotThrow(() => applyMitigations(root));
    writeFileSync(file, source + '\n// unexpected edit\n');
    assert.throws(() => verifyMitigations(root), /mitigation missing or modified/);
    assert.throws(() => applyMitigations(root), /unrecognized source/);
    writeFileSync(file, source);
    const metadata = join(root, 'node_modules', mitigation.packageName, 'package.json');
    const original = readFileSync(metadata, 'utf8');
    writeFileSync(metadata, JSON.stringify({ version: '99.0.0' }));
    assert.throws(() => verifyMitigations(root), /expected .* found 99\.0\.0/);
    writeFileSync(metadata, original);
  }
  const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
  lock.packages['node_modules/parent/node_modules/braces'] = { version: '3.0.3' };
  writeFileSync(join(root, 'package-lock.json'), JSON.stringify(lock));
  assert.throws(() => verifyMitigations(root), /unexpected locked copies/);
});

test('audit gate accepts only verified mitigations and rejects new advisories or invalid audit responses', t => {
  const bin = mkdtempSync(join(tmpdir(), 'nscene-audit-'));
  t.after(() => rmSync(bin, { recursive: true, force: true }));
  const npm = join(bin, 'npm');
  const report = {
    auditReportVersion: 2,
    vulnerabilities: {
      braces: { via: [{ severity: 'high', url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm' }] },
      'node-forge': { via: [{ severity: 'high', url: 'https://github.com/advisories/GHSA-86w9-cpqp-85rv' }] },
    },
  };
  function audit(data) {
    writeFileSync(npm, `#!${process.execPath}\nprocess.stdout.write(${JSON.stringify(JSON.stringify(data))}); process.exit(1);\n`, { mode: 0o755 });
    return spawnSync(process.execPath, [join(__dirname, 'security-audit-policy.mjs')], {
      encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
    });
  }
  const accepted = audit(report);
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.match(accepted.stderr, /exact installed local mitigations verified/);
  report.vulnerabilities.newPackage = { via: [{ severity: 'critical', url: 'https://example.test/new-advisory' }] };
  const blocked = audit(report);
  assert.equal(blocked.status, 1);
  assert.match(blocked.stderr, /newPackage: critical/);
  assert.equal(audit({ error: { message: 'registry unavailable' } }).status, 2);
  assert.equal(audit({}).status, 2);
});
