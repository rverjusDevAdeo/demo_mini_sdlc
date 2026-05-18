---
description: "Chore planning — writes a spec file, no source edits"
---

# Chore Planning

## Purpose

Produce a markdown spec under `specs/` that another agent will use to perform a maintenance chore (rename, comment cleanup, dependency bump, doc update, etc.). You plan; you do not act. Single side-effect, single-line reply.

Level 2 (Workflow Prompt).

## Variables

- `issue_text`: $ARGUMENTS — free-form chore description.
- `spec_path`: `specs/spec-{descriptive-name}.md` where `{descriptive-name}` is a kebab-case label derived from `issue_text` (e.g. `rename-ops-dict`, `add-type-hints`, `update-readme`).

## Instructions

- **One side effect**: write exactly one file at `spec_path`. Do NOT edit `app.py`, `test_app.py`, `README.md`, or anything else.
- **Output contract**: your entire reply MUST be the value of `spec_path` — no prose, no backticks, no quotes, no commentary.
- Even if the chore looks already done, still write the spec. Put the "already done" note INSIDE the file, never in your reply.
- Keep behavior strictly identical unless the chore explicitly asks for a behavioral change.
- No new dependencies.

## Workflow

1. Read `app.py`, `test_app.py`, and `README.md` to ground yourself.
2. Decide the smallest, safest change. Order steps foundational-first.
3. Write `spec_path` using the **Spec Format** below.
4. Reply with `spec_path` and nothing else.

## Spec Format

```md
# Chore: <name>

## Description
<what to do and why>

## Files to Modify
- `<file>` — <what changes>

## Step by Step Tasks
1. <Step 1>
2. <Step 2>
3. Run the Validation Commands.

## Validation Commands
- `uv run --with pytest pytest test_app.py -v`
```

## Report

Reply with the value of `spec_path`. Nothing else.
