---
description: "Document — update README's supported-operations section with the new behavior"
---

# Document

## Purpose

Reflect the just-shipped change in `README.md` so users see it. Targeted, minimal update — never a full rewrite of the README.

Level 2 (Workflow Prompt).

## Variables

- `plan_path`: $ARGUMENTS — path to the spec file from the planner.
- `readme_path`: `README.md` (in the current directory, `demo_sdlc/`).

## Instructions

- Touch only `readme_path`. Do NOT modify `app.py`, `test_app.py`, or the spec.
- Match the existing bullet format in the `## Supported operations` section:
  ```
  - `<op> a b` — <short description>
  ```
- Append new operations at the end of the list (do not re-sort).
- For non-operation changes (e.g. new error message, output format), append a short bullet under a `## Behavior notes` section. Create that section only if it does not already exist.

## Workflow

1. Read the spec at `plan_path`. Note the `Description` and any new operation / behavior added to `app.py`.
2. Read `readme_path`.
3. Decide the type of update:
   - **New operation**: add a single bullet to `## Supported operations`.
   - **Behavior change**: add a bullet to `## Behavior notes` (creating the section if needed).
4. Apply the edit.
5. Produce the **Report** below.

## Report

Reply with exactly the path of the updated file and nothing else:

```
README.md
```
