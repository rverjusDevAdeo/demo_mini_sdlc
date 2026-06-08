---
name: clean-code
description: >
  Apply clean-code principles to any code you write or refactor. Use proactively when implementing
  or fixing a feature in app.py / test_app.py: intention-revealing names, small single-purpose
  functions, no magic numbers, early returns, no dead code.
---

# Clean Code

Apply these principles to every change you make:

- **Intention-revealing names.** No abbreviations, no single letters except trivial loop indices.
- **One function = one job.** Keep functions short; extract a helper rather than nesting logic.
- **No magic numbers or strings.** Promote them to named constants near the top of the module.
- **Early returns.** Prefer guard clauses over nested `if/else`.
- **No dead code, no redundant comments.** The code should read clearly without narration.
- **Consistent error handling.** Raise precise exceptions with clear messages.

Keep the public behavior identical unless the spec asks otherwise — clean-code is about *form*, not *function*.
