# HALO Offline Recovery Vault

Status: mandatory pre-public-beta recovery requirement
Date: 2026-10-05

HALO's production streaming platform cannot be fully air-gapped because creators and viewers require network access. HALO therefore uses a split model:

- the production platform is internet-facing behind hardened edge and private-service boundaries;
- a separately controlled **offline recovery vault** retains the minimum material required to recover from catastrophic compromise without depending on the live platform, media provider, or a single cloud account.

## Security objective

A destructive compromise of the production cloud account, application runtime, CI/CD credentials, database administrators, streaming provider, or ordinary backup account must not be sufficient to destroy every recoverable copy of HALO canonical state.

The offline vault is a recovery control, not a second production database and not a source for routine reads.

## Vault contents

Approved offline sets may contain:

1. encrypted PostgreSQL backup sets and integrity manifests;
2. encrypted object-storage inventory/manifests and selected irreplaceable objects according to the retention policy;
3. infrastructure-as-code and deployment manifests required to rebuild a clean environment;
4. schema migrations and application release identifiers;
5. emergency recovery documentation and dependency/provider inventory;
6. separately protected recovery key material or key-recovery components where the selected cryptographic design requires them;
7. append-oriented security/audit exports required for incident reconstruction;
8. hashes/signatures needed to independently verify backup authenticity and completeness.

The vault must not become a convenient dumping ground for unnecessary production data.

## Isolation requirements

A backup is not considered air-gapped merely because it is in another bucket or another folder.

At least one recovery generation must satisfy all of the following:

- no continuously mounted production filesystem;
- no standing application credential can modify or delete it;
- no streaming-provider credential can access it;
- no ordinary CI/CD token can access it;
- no routine production service identity can access it;
- write/import is performed through a controlled transfer procedure;
- after transfer, the recovery copy returns to an offline or otherwise non-routable state;
- physical or account-level access is limited to specifically designated recovery custodians;
- encryption keys and encrypted backup data are not kept in the same administrative blast radius;
- access and transfer events are recorded outside ordinary application logs.

A hardware-encrypted removable copy stored securely can meet the offline requirement when operational controls are strong. A separately owned offline machine or vault appliance can also meet it. Cloud immutability may supplement this design but does not replace the genuinely offline generation.

## Backup generations

HALO should maintain multiple independent recovery classes:

### Online operational recovery

- point-in-time database recovery;
- short recovery point objective;
- intended for routine operator mistakes and limited failures;
- not treated as protection from total cloud-admin compromise.

### Immutable/off-account recovery

- encrypted;
- retention locked where supported;
- administratively separated from the production runtime;
- designed to survive destructive application or primary-account events.

### Offline recovery generation

- disconnected after controlled transfer;
- retained on a defined rotation;
- independently integrity checked;
- required for catastrophic recovery exercises.

## Transfer procedure

A vault export must be a deliberate operation:

1. produce a consistent backup from the canonical database/storage systems;
2. encrypt before leaving the trusted backup process;
3. generate a manifest containing object/file identifiers, byte sizes, hashes, schema/release identifiers, and export time;
4. verify the encrypted artifact against that manifest;
5. transfer through the approved controlled path;
6. verify the offline copy again after transfer;
7. disconnect or remove network reachability;
8. record the generation ID, custodian, verification result, and retention date;
9. never place plaintext production secrets in the backup manifest.

## Restore drill

The vault is not considered operational until HALO has restored from it into a clean isolated environment.

Each drill must prove that the team can:

- obtain the required recovery authorization;
- recover or reconstruct decryption capability;
- verify backup integrity before restore;
- create clean PostgreSQL and object-storage infrastructure;
- apply the correct application/schema release;
- restore data without connecting the clean environment to compromised production resources;
- rotate all secrets, provider credentials, stream keys, OAuth credentials, signing keys, and privileged sessions that cannot be trusted after the incident;
- reconcile provider state against HALO canonical state rather than importing provider state as truth;
- validate critical counts and sampled records after restore;
- preserve incident evidence before destructive cleanup;
- document recovery time and identified gaps.

## Catastrophic-compromise rule

After suspected platform-wide compromise, HALO must not simply restore data into the same potentially compromised control plane.

Recovery should assume replacement of affected infrastructure and credentials. The clean environment must be rebuilt from reviewed source/manifests, restored from verified recovery data, and reconnected to external providers only after credentials are replaced.

## Required evidence before public beta

The following evidence is required before claiming offline recovery readiness:

- named recovery architecture and storage mechanism;
- proof that the offline generation is unreachable by normal production/CI credentials;
- successful integrity verification of an exported generation;
- successful restore into a clean test environment;
- successful privileged/session/provider credential rotation exercise;
- documented recovery time and recovery point achieved;
- documented custodian/access procedure;
- at least one drill simulating destructive cloud-administrator compromise.

Until those items exist, the offline vault is a **designed requirement**, not a deployed or verified control.
