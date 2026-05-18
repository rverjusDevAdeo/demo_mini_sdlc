---
description: "Feature planning — writes a spec file, no source edits"
---

# Feature Planning

## Purpose

Produce a markdown spec under `specs/` that another agent will use to build the feature. You plan; you do not build. Single side-effect, single-line reply.

Level 2 (Workflow Prompt).

## Variables

- `issue_text`: $ARGUMENTS — free-form feature description.
- `spec_path`: `specs/spec-{descriptive-name}.md` where `{descriptive-name}` is a kebab-case label derived from `issue_text` (e.g. `add-modulo-op`, `support-negative-args`, `pretty-print-result`).

## Instructions

- **One side effect**: write exactly one file at `spec_path`. Do NOT edit `app.py`, `test_app.py`, `README.md`, or anything else.
- **Output contract**: your entire reply MUST be the value of `spec_path` — no prose, no backticks, no quotes, no commentary.
- Even if the feature already looks built, still write the spec. Put the "already done" note INSIDE the file, never in your reply.
- The spec's `Files to Modify` section may only list `app.py` and/or `test_app.py`.
- Mandate at least one test for the new behavior (happy path; add an edge case if the feature has one).
- No new dependencies, no decorators, no helper modules — keep the implementation surface inside `app.py`.

## Workflow

1. Read `app.py` and `test_app.py` to ground yourself in the target app.
2. Decide the smallest change that delivers the feature described in `issue_text`.
3. Write `spec_path` using the **Spec Format** below.
4. Reply with `spec_path` and nothing else.

## Spec Format

```md
# Feature: <name>

## Description
<2-4 sentences explaining what to build and why.>

## Files to Modify
- `app.py` — <what changes>
- `test_app.py` — <what tests to add>

## Step by Step Tasks
1. <First concrete step, e.g. "Add `mod(a, b)` function in app.py">
2. <Second step, e.g. "Register it in the `OPS` dict">
3. <Add tests in test_app.py>
4. <Run the Validation Commands below>

## Validation Commands
- `uv run --with pytest pytest test_app.py -v`
- `python3 app.py <op> <a> <b>` — verify the new op runs from the CLI
```

## Report

Reply with the value of `spec_path`. Nothing else.
