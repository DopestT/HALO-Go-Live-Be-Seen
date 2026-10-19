# SDD ledger — plan: docs/superpowers/plans/2026-10-19-nscene-messenger-v1.md

## Pre-flight rulings

- **Isolation:** This harness has GitHub write access and GitHub Actions but no checked-out repository/worktree terminal. `feature/nscene-messenger-v1` is therefore the isolated implementation branch and GitHub Actions is the execution/verification surface. `main` remains untouched. Cost if wrong: branch isolation is weaker than a filesystem worktree, so every write must name the feature/staging branch explicitly.
- **CI staging:** `feature/**` pushes run verification; `feat/**` staging branches do not. RED test commits are executed on the feature branch; GREEN file batches may be assembled on a `feat/**` branch and fast-forwarded once to reduce noisy CI runs.

## Task 1 — Messenger schema and sqlc contract

- **RED:** commit `f0b763f56387d691c01db3a7019b9b76e201a490`; Verify HALO run `39245229066`; backend failed because `backend/internal/messaging/dbgen` did not exist, exactly matching the intended generated-contract failure.
- **Ruling:** migration-count assertions in Verify HALO move from 3 to 4 because Messenger introduces `004_messenger_v1.sql`. Cost if wrong: an unexpected migration count could be hidden, so the count remains exact rather than `>= 4`.
- **GREEN attempt 1:** commit `6b92424532f1b5846859d7b08760e03c1d74a6b0`; Verify HALO run `39245685823` exposed that `moderation_reports` already exists in migration 002. Migration failed on nonexistent `review_status`; sqlc failed on nonexistent `target_type`.
- **Ruling:** reuse and extend the existing platform `moderation_reports` table rather than creating a competing Messenger report table. Messenger-specific target columns remain nullable so existing live moderation reports stay valid. Cost if wrong: a unified table increases schema coupling, but avoids duplicate moderation systems and preserves existing platform reporting semantics.
- **GREEN attempt 2:** commit `95c67d51a781c6cc4e5f11deeeb0fcea9fade983`; Verify HALO run `39246074967`. Migration, runtime image, client, and sqlc generation passed; generated models then revealed an undeclared `github.com/google/uuid` dependency.
- **Ruling:** map sqlc UUID outputs to dependency-free Go types (`string` / `database/sql.NullString`) rather than adding a new UUID library solely for generated Messenger access. Cost if wrong: UUID parsing is not performed by generated models, but the database remains authoritative and Messenger code treats those identifiers as opaque strings.
- **GREEN:** commit `be905c1708e1b915972d3b43587a85e78c509bbb`; Verify HALO run `39246419067`; sqlc generation, backend tests, vet, API build, four migrations applied twice, runtime Docker migration, hardened-media constraints, client tests, and typecheck all passed.
- **Ruling:** generated sqlc source is produced during verification/build rather than hand-edited. Any build path that compiles Messenger must run `sqlc generate` first. Cost if wrong: a developer invoking raw `go test` in a fresh checkout without generation will fail, so Makefile/CI/Docker build paths must preserve generation explicitly.

## Task 2 — Transactional repository and policy service

- **RED:** commit `27857c82d6e1b2abad74224691032dc2850e5e3c`; Verify HALO run `39246708577`; backend failed on undefined Messenger domain/service symbols while Task 1 generation/migrations continued to pass. This confirms the service-policy tests are executing the intended missing behavior.
- **Ruling:** the service owns authentication-adjacent policy (participant checks, recipient-only accept/decline, Unicode limits, report validation), while the Postgres repository repeats request/block checks inside write transactions where races could otherwise bypass service prechecks. Cost if wrong: duplicated checks add code, but reduce time-of-check/time-of-use gaps for sends and duplicate conversation creation.
- **Ruling:** duplicate direct-conversation creation uses `INSERT ... ON CONFLICT DO NOTHING`; when the pair already exists, the repository returns the existing conversation and its original first message without inserting another pending message. Cost if wrong: callers receive existing state instead of a newly-created response, which is intentional idempotent behavior for V1.
- **Ruling:** because generated `dbgen` source is not committed, the backend Docker build now runs pinned sqlc generation before `go build`. Cost if wrong: image builds perform an additional pinned tool download, but remain reproducible and do not depend on untracked generated files.
