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
- **Ruling:** because generated `dbgen` source is not committed, the backend Docker build runs pinned sqlc generation before `go build`. Cost if wrong: image builds perform an additional pinned tool download, but remain reproducible and do not depend on untracked generated files.
- **GREEN attempt 1:** commit `71f397b56c5100f8192e7e7f3c350168aeae900b`; Verify HALO run `39247285535`; sqlc rejected an ambiguous `conversation_id` reference in the read-marker query.
- **GREEN attempt 2:** commit `a5a13b1f8db53cbb563498ce631e3752ac4159c0`; Verify HALO run `39247612106`; sqlc generation succeeded, then Go compilation exposed the nullable read-marker argument type.
- **Ruling:** pair-sensitive writes lock both user rows in ascending ID order inside the same transaction. Conversation creation, send, block, and unblock therefore serialize consistently for one pair; send also locks the conversation row. Cost if wrong: concurrent operations on the same two users serialize more aggressively, but unrelated user pairs remain independent and policy cannot be bypassed by a block/send race.
- **Ruling:** accept/decline updates mutate only conversations still in `pending`; if another transition already won, the repository reloads current state and returns an idempotent result or the correct terminal error. Cost if wrong: a concurrent accept/decline can no longer overwrite the first completed transition.
- **GREEN:** commit `627094f48577aca50fe9a821b92ba5631996a70f`; Verify HALO run `39248079521`; client tests/typecheck, sqlc generation, Messenger/backend tests, vet, API build, four migrations, runtime Docker migration, and hardened-media constraints all passed.

## Task 3 — Authenticated HTTP API and per-user rate limits

- **RED:** commit `400739f0707320bd4be257f80b865c76ae852a1d`; Verify HALO run `39248572849`; backend failed only on missing Handler/HandlerService/UserRateLimiter/RateAction symbols, while existing client tests stayed green.
- **Ruling:** Messenger product limits are keyed by authenticated user ID and action in a dedicated fixed-window limiter; the existing IP limiter remains a separate global abuse layer. Cost if wrong: a fixed window is simpler than a sliding window and permits boundary bursts, but enforces the exact approved request ceilings without conflating users behind one IP.
- **Ruling:** handler JSON bodies are capped at 16 KiB and sender identity is never represented in request DTOs. Extra client-supplied sender fields are ignored; acting identity comes only from JWT middleware context `user_id`.
- **GREEN:** commit `eb9dcdc4db578f1cec66c5968f673b8de2f91b12`; Verify HALO run `39248923696`; complete Messenger route tests, exact rate-limit boundary tests, backend tests/vet/API build, runtime migrations, and existing client tests/typecheck all passed.

## Task 4 — Post-commit Redis event publishing

- **RED:** commit `3fbab79e43c6d4e5ad243b55bf55e6fa76d93482`; Verify HALO run `39249336774`; backend failed only on missing Event/EventPublisher symbols and the old single-argument `NewService`, confirming the new tests were exercising the intended absent event layer.
- **Ruling:** event payloads contain only state-transition identifiers (`conversation_id`, `message_id`, actor/target user IDs, request status) and never message bodies. Publisher failure is logged with identifiers only and is deliberately ignored after the database mutation has succeeded.
- **Ruling:** `NewService` accepts an optional publisher and defaults to a no-op publisher, preserving all existing service tests/degraded operation while production wires the existing Redis client to channel `nscene:messenger:events`.
- **GREEN:** commit `484d82655a30ce479c0a7dd1f0d8bbb4df117dc8`; Verify HALO run `39249817783`; event tests, backend tests/vet/API build, client tests/typecheck, four migrations, runtime Docker image, and hardened-media constraints all passed.
