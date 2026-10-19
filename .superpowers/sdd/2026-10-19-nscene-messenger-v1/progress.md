# SDD ledger — plan: docs/superpowers/plans/2026-10-19-nscene-messenger-v1.md

## Pre-flight rulings

- **Isolation:** This harness has GitHub write access and GitHub Actions but no checked-out repository/worktree terminal. `feature/nscene-messenger-v1` is therefore the isolated implementation branch and GitHub Actions is the execution/verification surface. `main` remains untouched. Cost if wrong: branch isolation is weaker than a filesystem worktree, so every write must name the feature/staging branch explicitly.
- **CI staging:** `feature/**` pushes run verification; `feat/**` staging branches do not. RED test commits are executed on the feature branch; GREEN file batches may be assembled on a `feat/**` branch and fast-forwarded once to reduce noisy CI runs.

## Task 1 — Messenger schema and sqlc contract

- **RED:** commit `f0b763f56387d691c01db3a7019b9b76e201a490`; Verify HALO run `39245229066`; backend failed because `backend/internal/messaging/dbgen` did not exist, exactly matching the intended generated-contract failure.
- **Ruling:** migration-count assertions in Verify HALO move from 3 to 4 because Messenger introduces `004_messenger_v1.sql`. Cost if wrong: an unexpected migration count could be hidden, so the count remains exact rather than `>= 4`.
- **GREEN attempt 1:** commit `6b92424532f1b5846859d7b08760e03c1d74a6b0`; Verify HALO run `39245685823` exposed that `moderation_reports` already exists in migration 002. Migration failed on nonexistent `review_status`; sqlc failed on nonexistent `target_type`.
- **Ruling:** reuse and extend the existing platform `moderation_reports` table rather than creating a competing Messenger report table. Messenger-specific target columns remain nullable so existing live moderation reports stay valid. Cost if wrong: a unified table increases schema coupling, but avoids duplicate moderation systems and preserves existing platform reporting semantics.
