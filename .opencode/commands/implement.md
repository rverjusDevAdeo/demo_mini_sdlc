---
description: "Implement a spec file produced by /feature, /bug or /chore"
agent: developer
---

# Implement

## Purpose

Execute a spec file faithfully. You are the **implementor**: a planner has already decided the *what*; you do the *how* within the spec's stated scope. You do not re-plan, re-scope, or invent extra features.

Level 5 (Higher Order Prompt): the same workflow applies to any spec the planner produces.

## Variables

- `plan_path`: $ARGUMENTS — path to a markdown spec under `specs/`.

## Instructions

- Touch **only** the files listed in the spec's `Files to Modify`.
- Prefer `Edit` over rewriting whole files.
- Apply changes in the spec's `Step by Step Tasks` order — foundational steps first.
- Run every `Validation Command` in the spec. If a command fails, fix the regression in the same files and re-run once. If it still fails, surface the failure in the report rather than hiding it.
- If the spec is missing a detail you need, make the minimal reasonable choice and flag it in `Open Questions` of the report.

## Workflow

1. Read the spec at `plan_path`. Locate its `Files to Modify`, `Step by Step Tasks`, and `Validation Commands` sections.
2. Read every file listed in `Files to Modify` before editing.
3. Execute each task in order. After each task, sanity-check the change against the spec's intent.
4. Run all `Validation Commands`. If any fails, apply a minimal fix and re-run once.
5. Produce the **Report** below.

## Report

Return a concise structured report:

```
## Summary
- <change 1, mapped to spec step #N>
- <change 2, mapped to spec step #N>
- <change 3, mapped to spec step #N>

## Files changed
<output of `git diff --stat` or equivalent>

## Validation
- `<command 1>` → pass | fail (<one-line reason>)
- `<command 2>` → pass | fail (<one-line reason>)

## Open Questions
<omit if none; otherwise: spec ambiguity + the choice you made>
```
