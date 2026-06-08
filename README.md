# Demo SDLC — an end-to-end opencode workflow

> **Part 2 of the opencode demo.** Part 1 (`demo_agents_command_skills`) teaches the *building blocks* of opencode (Command / Agent / Skill / Plugin) with deterministic toy examples. **This repo applies those blocks to a real workflow**: a mini-SDLC (Software Development Life Cycle) that evolves a small CLI calculator, from ticket to docs, in a single opencode session.

The target app is deliberately tiny — a calculator (`app.py` + `test_app.py`) — so that **all the attention goes to the workflow**, not to the business code.

---

## 1. Recap: the 4 opencode building blocks

Everything in opencode is configured with Markdown files placed under `.opencode/`. Each block answers a different question:

| Block | Answers… | What it is | Lives in |
|---|---|---|---|
| **Command** | **WHAT** | A *workflow* triggered with `/name` | `.opencode/commands/` |
| **Agent** | **WHO** | A *personality* (language, model, permissions) | `.opencode/agents/` |
| **Skill** | **HOW** | A *capability* loaded on demand | `.opencode/skills/` |
| **Plugin** | **OBSERVABILITY** | TypeScript *hooks* that watch and log | `.opencode/plugins/` |

> 🧠 In this demo, **commands do all the work**. The repo has no dedicated agent or skill (it runs with the default agent); instead it pushes the use of **commands** far and adds **one plugin** to make execution observable. For the Agent/Skill separation, see part 1.

### Command levels (L1 → L7)

A command is not written ad hoc: it is built in **levels**, from a simple one-shot prompt up to an orchestrator. This demo covers 4 levels:

| Level | Defining trait | Example here |
|---|---|---|
| **L1** — High Level Prompt | one-shot, no workflow | `classify_issue.md` |
| **L2** — Workflow Prompt | variables + sequential steps | `feature.md`, `bug.md`, `chore.md`, `test.md`, `review.md`, `document.md`, `prime.md` |
| **L3** — Control Flow Prompt | loops and conditionals | `run_sdlc.md` (the orchestrator) |
| **L5** — Higher Order Prompt | executes content produced elsewhere (a spec) | `implement.md` |

> 📘 The full 7-level ladder is detailed in part 1 (`.opencode/commands/COMMAND_LEVELS.md`).

---

## 2. What this repo does

`/run_sdlc "<change description>"` chains **six phases** over the calculator, in a single session:

```
classify → plan → implement → test → review → document
```

### The core idea: one command = one responsibility (SRP)

The whole point of this workflow is to **decompose the engineering cycle into small, single-purpose steps**. Each command does **exactly one thing** and follows the Single Responsibility Principle — it is short, easy to read, easy to test in isolation, and easy to reuse. The orchestrator's only job is to wire them together. Here is every command and its single responsibility:

| Command | Single responsibility | Input | Output / side effect |
|---|---|---|---|
| **`/prime`** | **Load context.** Read `README.md`, `app.py`, `test_app.py` so the agent understands the app before doing anything. | — | A 3-bullet summary. No file changes. |
| **`/classify_issue`** | **Triage.** Map a free-form ticket to one category. Nothing else — it must not even read the codebase. | ticket text | A single token: `/feature`, `/bug`, `/chore`, or `0`. |
| **`/feature`** | **Plan a feature.** Decide the smallest change and write it down. Plans, never builds. | ticket text | Writes one spec under `specs/`; replies with its path. |
| **`/bug`** | **Plan a fix.** Find the root cause, mandate a regression test. Plans, never fixes. | ticket text | Writes one spec under `specs/`; replies with its path. |
| **`/chore`** | **Plan maintenance.** A rename, refactor, doc update… with behavior kept identical. Plans, never acts. | ticket text | Writes one spec under `specs/`; replies with its path. |
| **`/implement`** | **Build.** Execute a spec faithfully — touch only the files it lists, run its validation commands. Does not re-plan or re-scope. | spec path | Edits `app.py` / `test_app.py`; structured report. |
| **`/test`** | **Observe.** Run pytest **once** and report a machine-parseable line. Does not edit code, does not retry. | — | `TEST RESULT: passed N / failed M`. |
| **`/review`** | **Judge.** Compare the diff against the spec and return a verdict. **Read-only** — never patches, never commits. | spec path | `REVIEW VERDICT: PASS \| PASS_WITH_NITS \| FAIL` + blockers. |
| **`/document`** | **Reflect.** Update the README's "Supported operations" to match the shipped change. Touches only the README. | spec path | Edits `README.md`. |
| **`/run_sdlc`** | **Orchestrate.** Cue the commands above in order, wrap the risky ones in bounded loops, produce the final report. Owns no domain logic. | ticket text | Runs the whole pipeline; prints `SDLC COMPLETE`. |

> 🧩 Notice the clean separation: **planning is split from building** (`/feature` writes a spec, `/implement` executes it), and **observing is split from deciding** (`/test` only reports, `/review` only judges — neither one fixes anything). The fixing lives in the orchestrator's loops. This is SRP applied to a dev cycle: each box has exactly one reason to change.

The orchestrator (`run_sdlc.md`) never **inlines** the phases' content: at each step it **reads the matching playbook** in `.opencode/commands/` and applies it. Each playbook therefore stays the **single source of truth** for its phase — exactly the "a conductor doesn't play the instruments, it cues the musicians" principle from part 1.

Two **bounded loops** keep the workflow honest without manual retries — **this is the heart of the demo**:

- **`<test-fix-loop>`** (max 3 iterations): if `pytest` is red, read the error, fix **the code** (never the test), re-run. This is what distinguishes a workflow from a plain pipeline.
- **`<review-patch-loop>`** (max 2 iterations): if the review returns a `FAIL` verdict, patch the blockers and re-review.

If a loop hits its ceiling, the failure is **recorded in the final report** and the workflow continues — it never blocks.

### The pipeline diagram

```
/run_sdlc "Add a modulo operation"
        │
        ▼
┌───────────────────────────────────────────────────────────────────────┐
│ PHASE 1 — CLASSIFY      classify_issue.md  (L1)                       │
│   free-form text  →  a single token: /feature | /bug | /chore | 0     │
└───────────────────────────────────────────────────────────────────────┘
        │  kind = feature
        ▼
┌───────────────────────────────────────────────────────────────────────┐
│ PHASE 2 — PLAN          feature.md | bug.md | chore.md  (L2)          │
│   writes ONE spec  →  specs/spec-<name>.md   (no code edits)          │
└───────────────────────────────────────────────────────────────────────┘
        │  plan_path
        ▼
┌───────────────────────────────────────────────────────────────────────┐
│ PHASE 3 — IMPLEMENT     implement.md  (L5)                            │
│   executes the spec  →  edits app.py / test_app.py  (nothing else)    │
└───────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────────┐
│ PHASE 3.5 — INJECT BUG  (demo only)                                   │
│   breaks 1 char of a stable function  →  gives the fix-loop something │
│   to recover from. REMOVE outside the demo.                           │
└───────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────────┐
│ PHASE 4 — TEST          test.md  (L2, single-shot)      ╭──────────╮  │
│   pytest → "TEST RESULT: passed N / failed M"           │ fix-loop │  │
│   if red: fix the CODE, re-run (≤ 3×)                   ╰────┬─────╯  │
└──────────────────────────────────────────────────────────────┼────────┘
        │  green                                               │ back
        ▼                                                      ▲
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 5 — REVIEW        review.md  (L2, read-only)      ╭───────────╮  │
│   diff vs spec → "REVIEW VERDICT: PASS | …_NITS | FAIL" │ patch-loop│  │
│   if FAIL: patch the blockers, re-review (≤ 2×)         ╰────┬──────╯  │
└──────────────────────────────────────────────────────────────┼─────────┘
        │  PASS                                                │ back
        ▼                                                      ▲
┌───────────────────────────────────────────────────────────────────────┐
│ PHASE 6 — DOCUMENT      document.md  (L2)                             │
│   updates the "Supported operations" section of this README           │
└───────────────────────────────────────────────────────────────────────┘
        │
        ▼   final report: SDLC COMPLETE (classification, spec, diff, tests, review, doc)
```

### Why a phase 3.5 "INJECT BUG"?

Without a bug, the `test-fix-loop` would never have anything to repair and you would never *see* that it works. This phase deliberately mutates **one character** of a stable function (e.g. `return a + b` → `return a - b`) so that at least one existing test breaks in phase 4. The loop detects the red, reads the error, restores the code, goes back to green. **It's a pedagogical artifact: remove it for any real use** (the orchestrator says so explicitly).

### The contracts between phases

What holds the workflow together is a set of **strict output contracts**, parseable by the orchestrator:

- `classify_issue` replies with **a single token** (`/feature`, `/bug`, `/chore` or `0`).
- The planners (`feature`/`bug`/`chore`) reply with **only the spec path**, and have **a single side effect**: writing that spec under `specs/`.
- `test` emits a `TEST RESULT: passed N / failed M` line.
- `review` emits a `REVIEW VERDICT: PASS | PASS_WITH_NITS | FAIL` line.

Data flows **through files** (the spec under `specs/`, the git diff), not through return values: everything is inspectable on disk.

### Running each command independently

`/run_sdlc` is just a conductor — **every phase is a standalone command you can invoke on its own**. This is useful to debug one phase, to re-run a single step, or to drive the SDLC by hand instead of end-to-end. Because data passes through files, each command only needs its input to exist on disk:

```bash
/prime                                         # load app context, no side effect
/classify_issue Add a modulo operation         # → prints one token (/feature | /bug | /chore | 0)
/feature Add a modulo operation                # → writes specs/spec-add-modulo-op.md, prints its path
/implement specs/spec-add-modulo-op.md         # → edits app.py / test_app.py from that spec
/test                                          # → runs pytest once, prints "TEST RESULT: passed N / failed M"
/review specs/spec-add-modulo-op.md            # → prints "REVIEW VERDICT: …" (read-only)
/document specs/spec-add-modulo-op.md          # → updates this README's Supported operations
```

Each step is independently testable: pre-create its input file (a spec for `/implement`, `/review`, `/document`) and run just that command. Note that `/test` and `/review` are **single-shot** on their own — the retry/fix logic only kicks in when `/run_sdlc` wraps them in its `<test-fix-loop>` / `<review-patch-loop>`.

---

## 3. Observability — the `sdlc-logger` plugin

`.opencode/plugins/sdlc-logger.ts` subscribes to opencode's lifecycle hooks and writes a **JSONL** trace under `agents/sdlc_logs/<sessionId>/sdlc.jsonl`. It captures two things:

1. **Tool calls** (`tool.execute.before/after`) — every `read`, `edit`, `write`, `bash`… with its compacted arguments and duration.
2. **SDLC signals** spotted in the model's streamed text (`message.part.updated`), via regexes: phase entry, loop iteration, test result, review verdict, injected bug, SDLC done. Each signal is **deduplicated** per session (text streams in chunks, otherwise the same banner would re-fire on every chunk).

The plugin is **non-blocking** (everything is in `try/catch`): a logging failure never interrupts opencode. You get a narratable trace of the whole run without touching any command.

Example trace lines (real excerpt from an "add modulo" session):

```jsonl
{"kind":"tool","tool":"write","file":".../specs/spec-add-modulo-op.md","size":1066}   ← PHASE 2: the spec
{"kind":"tool","tool":"edit","file":".../app.py","old":"return a + b","new":"return a - b"}  ← PHASE 3.5: bug injected
{"kind":"tool","tool":"bash","cmd":"uv run --with pytest pytest test_app.py -v"}        ← PHASE 4: pytest (red)
{"kind":"tool","tool":"edit","file":".../app.py","old":"return a - b","new":"return a + b"}  ← fix-loop: code restored
{"kind":"tool","tool":"edit","file":".../README.md"}                                    ← PHASE 6: docs updated
```

> ⚙️ After editing a file under `plugins/`, **restart opencode** so it reloads the plugin.

---

## 4. Layout

```
demo_sdlc/
├── app.py                       ← the calculator (4 operations + CLI dispatch)
├── test_app.py                  ← the pytest suite
├── README.md                    ← this file (updated by PHASE 6)
├── specs/                       ← spec written by the PLAN phase (created on first run)
├── agents/sdlc_logs/<session>/  ← JSONL traces written by the plugin
└── .opencode/
    ├── commands/
    │   ├── run_sdlc.md          ← L3: the orchestrator (phases + 2 loops)
    │   ├── classify_issue.md    ← L1: ticket → one token
    │   ├── feature.md / bug.md / chore.md   ← L2: planners → write a spec
    │   ├── implement.md         ← L5: executes the spec
    │   ├── test.md              ← L2: single-shot pytest
    │   ├── review.md            ← L2: read-only review → verdict
    │   ├── document.md          ← L2: updates this README
    │   └── prime.md             ← L2: loads the app's context
    └── plugins/
        └── sdlc-logger.ts       ← observability (JSONL + signals)
```

---

## 5. Run the demo

### Prerequisites

- `opencode` installed ([opencode.ai](https://opencode.ai))
- `uv` available (tests run via `uv run --with pytest pytest test_app.py -v`)
- Plugin dependencies installed: `cd .opencode && npm install` (pulls `@opencode-ai/plugin`)

### Execution

```bash
cd demo_sdlc
opencode                  # auto-discovers demo_sdlc/.opencode/
> /run_sdlc Add a modulo operation to the calculator
```

The agent prints a banner per phase, writes a spec under `specs/`, edits `app.py` and `test_app.py`, injects a bug, repairs it via the fix-loop, passes the review, updates this README, then prints the `SDLC COMPLETE` report.

### Inspect what happened

```bash
cat specs/spec-*.md                              # the spec produced in PHASE 2
git diff --stat                                  # what changed in the code
cat agents/sdlc_logs/<sessionId>/sdlc.jsonl      # the full plugin trace
```

### Try other tickets

Phase 1 routes on the ticket's verb:

```bash
> /run_sdlc Add a power operation (a ** b)               # → /feature
> /run_sdlc div by zero should print a clearer message   # → /bug
> /run_sdlc rename the OPS dict to OPERATIONS            # → /chore
```

---

## Supported operations

- `add a b` — addition
- `sub a b` — subtraction
- `mul a b` — multiplication
- `div a b` — division (raises on division by zero)

---

## 6. What this folder is NOT

No git ops, no GitHub integration, no PR creation, no persistent state files, no retries beyond the two bounded loops. It exists to demonstrate the **shape** of an SDLC workflow — orchestration, contracts between phases, feedback loops, observability — not to ship production code.

> 📁 Once the mechanics click here, the same blocks (leveled commands, bounded loops, trace plugin) scale up to real workflows.
