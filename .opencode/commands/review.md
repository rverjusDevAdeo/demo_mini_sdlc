---
description: "Review — verify the implementation matches the spec (single-shot; patch-loop lives in the orchestrator)"
---

# Review

## Purpose

Compare the current diff against the spec and produce a verdict (`PASS` / `PASS_WITH_NITS` / `FAIL`). This command is **single-shot** and **read-only**: it does not patch the code. The patch/re-review loop lives in the orchestrator's `<review-patch-loop>` in `run_sdlc.md`.

Level 2 (Workflow Prompt).

## Variables

- `plan_path`: $ARGUMENTS — path to the spec file produced by the planner.

## Instructions

- Do NOT edit any source file. Reading only.
- Do NOT run any git-mutating command: no `git commit`, `git add`, `git stash`, `git reset`, `git checkout <paths>`, `git restore`, `git rm`, `git tag`, `git push`. Read-only git inspection (`git diff`, `git status`, `git log`) is fine.
- A blocker is anything that means the spec's intent is not realized: a missing step, a wrong behavior, a missing/incorrect test, or a scope violation.
- A nit is a non-blocker: style, naming, dead code, missing comment where the spec asked for one.
- The verdict line must be parseable by the orchestrator — keep the exact format.

## Workflow

1. Read the spec at `plan_path`. Note its `Description`, `Files to Modify`, `Step by Step Tasks`, and `Validation Commands`.
2. Read the current contents of every file listed in `Files to Modify`.
3. Run `git diff app.py test_app.py` (or `git diff --no-color` on the relevant files) to capture the actual change set.
4. Compare diff vs spec along five axes (see Report).
5. Decide the verdict:
   - `PASS` — every spec step is implemented, scope respected, tests cover the new behavior.
   - `PASS_WITH_NITS` — same as PASS plus one or more nits worth noting.
   - `FAIL` — at least one blocker.

## Report

```
REVIEW VERDICT: <PASS | PASS_WITH_NITS | FAIL>

- Spec coverage: <does the diff implement every Step by Step Task? mention any missing step by number>
- Scope: <was the change limited to Files to Modify? flag any extra file touched>
- Tests: <are new behaviors covered by tests? mention any uncovered edge case>
- Code quality: <one short observation — readability, naming, dead code; "clean" if nothing>
- Risk: <one sentence on what could go wrong; "none" if nothing notable>

## Blockers
<omit if verdict is PASS or PASS_WITH_NITS; otherwise list each blocker as a numbered bullet with file:line and what to change>
```
