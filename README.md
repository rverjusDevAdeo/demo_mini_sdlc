# Demo SDLC — minimal end-to-end workflow

An ultra-simplified version of the SDLC in `../adws/` for live demos. One orchestrator slash command (`/run_sdlc`) chains the six phases (classify → plan → implement → test → review → document) in a single OpenCode session, operating on a tiny target app: a CLI calculator (`app.py` + `test_app.py`).

## Prerequisites

- `opencode serve --port 4096` running in one terminal
- `uv` available (tests run via `uv run --with pytest pytest test_app.py -v`)

## Run the demo

```bash
cd demo_sdlc
opencode               # picks up demo_sdlc/.opencode/ (not the repo-root one)
> /run_sdlc Add a modulo operation to the calculator
```

The agent prints a banner for each phase, writes a spec under `specs/`, edits `app.py` and `test_app.py`, runs `pytest`, reviews the diff, then updates this README's "Supported operations" section.

## Supported operations

- `add a b` — addition
- `sub a b` — subtraction
- `mul a b` — multiplication
- `div a b` — division (raises on division by zero)

## What this folder is NOT

No git ops, no GitHub integration, no PR creation, no state files, no retry loops. It exists to demonstrate the *shape* of the workflow, not to ship code.
