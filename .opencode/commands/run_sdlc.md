---
description: "Mini SDLC orchestrator — classify → plan → implement → test (with fix-loop) → review (with patch-loop) → document"
---

# Run SDLC

## Purpose

Execute a complete Software Development Life Cycle end-to-end on the demo calculator app (`app.py` + `test_app.py`) in a single OpenCode session. Each phase reads its dedicated playbook from `.opencode/commands/` and applies it. Two **bounded feedback loops** keep the workflow honest without manual retries: a test fix-loop and a review patch-loop. The loops are the point — without them the workflow is just a pipeline.

This is a Level 3 (Control Flow) orchestrator: sequential phases plus declared loops.

## Variables

- `issue_text`: $ARGUMENTS — free-form description of the change to make.
- `MAX_TEST_RETRIES`: `3` — upper bound on the test fix-loop iterations.
- `MAX_REVIEW_RETRIES`: `2` — upper bound on the review patch-loop iterations.

## Instructions

- Print a banner `══════ PHASE <N> : <NAME> ══════` **before** each phase.
- For every phase: read the playbook at `.opencode/commands/<name>.md` and apply its instructions faithfully — you ARE the agent that playbook addresses.
- Print a one-line result summary **after** each phase, then move on.
- Loops are bounded. If a loop hits its `max-iterations`, record the failure in the final report and continue to the next phase — never block the workflow.
- When fixing failing tests, fix the **code**, not the test. Never relax a spec to make a red test green.

## Workflow

### PHASE 1 — CLASSIFY

1. Read `.opencode/commands/classify_issue.md` and apply with `issue_text` as the issue body.
2. Result is one token: `/feature`, `/bug`, `/chore`, or `0`.
   - If `0`: print `CLASSIFY FAILED — aborting` and skip to the final Report.
   - Else: strip the leading `/` and store as `kind`.

### PHASE 2 — PLAN

1. Read `.opencode/commands/{kind}.md` (one of `feature.md`, `bug.md`, `chore.md`).
2. Apply with `issue_text`. The playbook writes a spec under `specs/` and replies with its path.
3. Store that path as `plan_path`.

### PHASE 3 — IMPLEMENT

1. Read `.opencode/commands/implement.md`.
2. Apply with `plan_path`. The playbook modifies `app.py` and/or `test_app.py` per the spec.

### PHASE 4 — TEST (fix-loop)

Initialize `test_iter = 0`.

<test-fix-loop max-iterations="MAX_TEST_RETRIES">

  - Read `.opencode/commands/test.md` and apply (no args). Capture the `TEST RESULT` line.
  - IF the test result is `passed N / failed 0`:
    - Record `test_outcome = "PASS (iter={test_iter})"`.
    - **Exit the loop.**
  - ELSE (one or more tests failed):
    - Print `── TEST FIX-LOOP iter {test_iter+1}/{MAX_TEST_RETRIES} ──`.
    - Inspect the failing test output (`file:line`, expected vs actual values, exception message).
    - Read the offending region of `app.py` (or `test_app.py` if the test itself is wrong per the spec).
    - Apply a minimal fix.
    - Increment `test_iter` and loop again.
  - IF `test_iter == MAX_TEST_RETRIES` and tests still failing:
    - Record `test_outcome = "FAIL after {MAX_TEST_RETRIES} retries — {one-line last error}"`.
    - **Exit the loop** and continue to the next phase.

</test-fix-loop>

### PHASE 5 — REVIEW (patch-loop)

Initialize `review_iter = 0`.

<review-patch-loop max-iterations="MAX_REVIEW_RETRIES">

  - Read `.opencode/commands/review.md` and apply with `plan_path`. Capture the `REVIEW VERDICT` line and any listed blockers.
  - IF the verdict is `PASS` or `PASS_WITH_NITS`:
    - Record `review_outcome = "{verdict} (iter={review_iter})"`.
    - **Exit the loop.**
  - ELSE (verdict is `FAIL`):
    - Print `── REVIEW PATCH-LOOP iter {review_iter+1}/{MAX_REVIEW_RETRIES} ──`.
    - For each blocker in the review report:
      - Edit `app.py` and/or `test_app.py` with a minimal patch addressing that blocker.
    - Re-run the test playbook ONCE (read `.opencode/commands/test.md`, apply, capture result) to confirm patches didn't regress tests. If they did, fix forward in the same iteration before re-reviewing.
    - Increment `review_iter` and loop again.
  - IF `review_iter == MAX_REVIEW_RETRIES` and verdict still `FAIL`:
    - Record `review_outcome = "FAIL after {MAX_REVIEW_RETRIES} retries — {last blocker}"`.
    - **Exit the loop** and continue to the next phase.

</review-patch-loop>

### PHASE 6 — DOCUMENT

1. Read `.opencode/commands/document.md`.
2. Apply with `plan_path`. The playbook updates `README.md` (or appends to it) and replies with the updated file path.
3. Store as `doc_path`.

## Report

Print this block — and only this block — at the very end:

```
╔══════════════════════════════════════════╗
║                SDLC COMPLETE             ║
╚══════════════════════════════════════════╝

- Classification : <kind>
- Spec           : <plan_path>
- Files changed  : <output of `git diff --stat` from demo_sdlc/>
- Tests          : <test_outcome>
- Review         : <review_outcome>
- Doc            : <doc_path>
```
