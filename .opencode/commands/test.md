---
description: "Test — run pytest on the mini calculator (single-shot; retries belong to the orchestrator)"
---

# Test

## Purpose

Run the pytest suite for the demo app and report a single-line, machine-parseable result. This command is **single-shot**: it does not retry. Retry/fix logic lives in the orchestrator's `<test-fix-loop>` in `run_sdlc.md`.

Level 2 (Workflow Prompt).

## Variables

- `test_command`: `uv run --with pytest pytest test_app.py -v`

## Instructions

- Run the command exactly once, from `demo_sdlc/` (the current working directory).
- Do NOT edit any source file. This command only observes and reports.
- Parse the pytest output to count `PASSED` and `FAILED`.
- Report in the exact format below — the orchestrator parses the first `TEST RESULT:` line.

## Workflow

1. Run `test_command`.
2. Capture stdout + stderr.
3. Count `PASSED` and `FAILED` test names from the output.
4. Produce the **Report** below.

## Report

```
TEST RESULT: passed <N> / failed <M>
- <test_name_1>: PASS
- <test_name_2>: FAIL — <one-line error: assertion message or exception type>
- ...
```

If everything passed: `TEST RESULT: passed N / failed 0` followed by the list. Done.
