---
description: "Classify an issue text into one of /feature, /bug, /chore"
---

# Classify Issue

## Purpose

Map a free-form issue text to a single command token. Used by `/run_sdlc` to pick which planner playbook to load next.

Level 1 (High Level Prompt).

## Variables

- `issue_text`: $ARGUMENTS — the issue body.

## Instructions

- Your entire response MUST be exactly ONE token from the `Command Mapping` below — nothing else. No prose, no markdown, no quotes, no commentary.
- You MUST NOT read, search, or examine the codebase. You MUST NOT call any tool. You MUST NOT write any file.
- Decide solely from `issue_text` and the `Command Mapping`.

## Command Mapping

- `/feature` — adds a new behavior, operation, or capability.
- `/bug` — fixes incorrect behavior, regression, or crash.
- `/chore` — maintenance: rename, refactor without behavior change, doc-only update, dependency bump.
- `0` — none of the above (do NOT default to `/feature` if unsure; output `0`).

## Issue

$ARGUMENTS
