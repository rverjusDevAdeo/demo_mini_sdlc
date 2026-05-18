---
description: "Bug planning — writes a spec file, no source edits"
---

# Bug Planning

## Purpose

Produce a markdown spec under `specs/` that another agent will use to fix the bug. You plan; you do not fix. Single side-effect, single-line reply.

Level 2 (Workflow Prompt).

## Variables

- `issue_text`: $ARGUMENTS — free-form bug description (symptoms, repro steps).
- `spec_path`: `specs/spec-{descriptive-name}.md` where `{descriptive-name}` is a kebab-case label derived from `issue_text` (e.g. `fix-div-zero-message`, `correct-float-precision`).

## Instructions

- **One side effect**: write exactly one file at `spec_path`. Do NOT edit `app.py`, `test_app.py`, `README.md`, or anything else.
- **Output contract**: your entire reply MUST be the value of `spec_path` — no prose, no backticks, no quotes, no commentary.
- Even if the bug looks already fixed, still write the spec. Put the "already fixed" note INSIDE the file, never in your reply.
- Be **surgical**: fix the root cause, nothing else. No drive-by refactors.
- Mandate a **regression test** in `test_app.py` that fails before the fix and passes after.
- The spec's `Files to Modify` may only list `app.py` and/or `test_app.py`.

## Workflow

1. Read `app.py` and `test_app.py` to ground yourself.
2. Reproduce the bug mentally and identify the root cause (line-level).
3. Write `spec_path` using the **Spec Format** below.
4. Reply with `spec_path` and nothing else.

## Spec Format

```md
# Bug: <name>

## Description
<symptoms, expected vs actual behavior>

## Root Cause
<one or two sentences pointing at the line(s) responsible — `app.py:NN`>

## Files to Modify
- `app.py` — <what to change>
- `test_app.py` — <regression test to add>

## Step by Step Tasks
1. Add the failing regression test in `test_app.py` first.
2. Apply the minimal fix in `app.py`.
3. Run the Validation Commands.

## Validation Commands
- `uv run --with pytest pytest test_app.py -v`
```

## Report

Reply with the value of `spec_path`. Nothing else.
