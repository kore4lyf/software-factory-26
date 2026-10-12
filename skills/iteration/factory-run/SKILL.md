---
name: factory-run
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
description: "Run /factory-run to turn a spec into a finished product with no mid build stops. Two decision modes: engineer decides upfront in one batch, or architect auto picks the recommended option. Build always runs to finish with fallbacks, blockers become follow ups, not stops."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Talk to the reader as `you`, warm and direct like a colleague, and present every step as a recommendation they may run or skip, never an order. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

This is the goal driven runner. Spec goes in, product comes out. No mid build interrogation, no half built app.

It sits above the existing skills and orchestrates them:

```
spec -> /scope -> /architect (batch) -> /develop (resilient) -> /check verify -> /test -> product + follow ups
```

Two decision modes, chosen once at the start:

| Mode | Name | Behaviour |
|---|---|---|
| 1 | `decide-upfront` | Architect every scope feature once, collect every load bearing question into one batch panel, engineer answers ahead, then build never asks again |
| 2 | `auto-recommended` | Architect picks its own recommended option for every load bearing decision, records it in the spec, builds without asking |

Mode 2 is the default factory behaviour. Mode 1 is for engineers who want control without interruption.

## When to use

Run `/factory-run [spec or idea]` when you want a finished app, not a conversation. Do not use per feature `/architect` then per feature `/develop` questioning when this skill is active. This skill replaces that loop.

## Execution

### Step 0: Pick the decision mode (the only required question)

Ask once, at the start, never again:

- **question**: "How should decisions be handled on this run?"
- **header**: "factory mode"
- **options**:
  1. `Auto recommended`: "Recommended for a true factory run. Architect picks the best option each time and records it. You review at the end."
  2. `I decide upfront`: "Architect all features first, I answer every question in one batch, then the build never stops to ask."

Record the answer in `docs/reviews/factory-log.md` as `Mode: auto-recommended` or `Mode: decide-upfront`. Every downstream skill reads it and obeys it.

### Step 1: Scope it (read only what exists)

1. If no `docs/scope/` exists, run `/scope` plan behaviour from the input spec or idea. Keep it coarse. Every feature gets `Needs spec: yes` unless it is trivially pure implementation.
2. If scope exists, run `/scope` replan behaviour to reconcile, then proceed. Never rebuild scope per feature inside the run.

### Step 2: Architect everything once (the batch gate)

This is the core of your request. Never architect one feature, build it, then architect the next. Architect the whole scope first.

1. List every scope feature with status `planned` and every feature whose spec pointer is missing or whose spec is `Proposed`.
2. For each, run the `/architect` design conversation logic, with one change:
   - In `decide-upfront` mode: do not ask per feature. Accumulate every ASK and RECOMMEND question across all features into one batch panel (max 4 per round, as many rounds as needed). Engineer answers all of them before any `/develop` starts. Write all specs as `Proposed`.
   - In `auto-recommended` mode: do not ask at all. For every question, take the option the architect would have marked `(recommended)`, write it into the spec with a one line why, plus the runner up. Tag the decision in the spec as `Auto: recommended pick, review in follow up if you disagree`.
3. Update each scope row to the ready to build shape: `Design it (spec)` ticked, spec linked, `Build it: /develop <feature>` with milestones.
4. If a feature truly cannot be specced (input spec contradicts itself), write the best coherent spec, log it under `## Blockers absorbed` in `factory-log.md`, and continue. Never stop the run here.

Result: when Step 2 ends, there are zero owed decisions left. `/develop` has no reason to invoke its Step 0 gate.

### Step 3: Build to finish (resilient develop)

Run `/develop` per feature in scope order, with the factory override active:

1. **Never stop for a decision.** The Step 0 spec gate is already cleared. If a new gap surfaces mid build, apply the run mode: `decide-upfront` mode already has answers, so reuse the closest answered pattern; `auto-recommended` mode takes the recommended pick, writes it as an `Assumed` spec appendix, and keeps building. Never present the `Architect it first` stop panel during a factory run.
2. **Never stop for an environment blocker.** Missing key, broken package, failing install, flaky service, rate limit: absorb it, do not halt. Fallback ladder, in order:
   - a. Real integration with placeholder config (`env.example`, documented in `factory-log.md`)
   - b. Local or file based stub behind the same interface (same function signature, marked `TODO(factory): wire real provider`)
   - c. Mock data seeded so UI and flows render end to end
   - d. Skip only that sub task, tick the rest, record the skip
3. **Spec wrong partway:** do not diverge silently and do not stop. Write the correction as an `Assumed` appendix, build to the correction, flag for `/architect` ratify later. The build continues.
4. **Every feature ends `in-progress` or `done`, never `blocked`.** A feature with absorbed blockers is still marked complete for build purposes, with a `factory: needs follow up` note pointing at `factory-log.md`.

### Step 4: Verify, test, report

1. Run `/check verify` derived from ACs. Failures caused by absorbed blockers (missing key, stubbed provider) do not fail the run. Record expected fail vs real fail in `factory-log.md`.
2. Run `/test` for durable paths. Stubbed integrations get a skipped test with a clear name, not a fake pass.
3. Write the final report:
   - `docs/reviews/factory-log.md`: mode, specs written, assumptions made, blockers absorbed with fallback used, verify outcome, follow up list (small by design, since the bulk of the app is built)
   - Spoken summary: what shipped, what needs your key or fix later, exact follow up commands (`/architect <feature>: ratify`, `/develop <feature>: wire real X`)

### Step 5: Follow ups stay small

The factory promise: the product is whole and runnable at the end of Step 4. Follow ups are wiring real keys, swapping a stub for a provider, ratifying an `Assumed` spec. They are never `rebuild half the app`.

## Artifact ownership

- Writes specs via `/architect` rules, code via `/develop` rules, nothing new.
- Owns exactly one new file: `docs/reviews/factory-log.md` (run mode, assumptions, blockers absorbed, follow ups).
- Never writes `docs/scope/` directly (delegates to `/scope`), never edits `AGENTS.md` (delegates to `/sync`).

## Rules that override the base skills during a run

1. No per feature question panels after Step 0. Batch once or auto pick.
2. No `Architect it first` hard stop. Assumed appendix plus continue.
3. No `blocked` status. Absorb, stub, log, continue.
4. `done` is set by the run when the slice is whole and self checked, even with stubs. Engineer ratifies later.

## Reference files

- Scope source: `docs/scope/` (owned by `/scope`)
- Specs: `docs/specs/` (owned by `/architect`)
- Build flow: `skills/build/develop/flow/build.md` (resilient override above applies)
- Design conversation: `skills/foundation/architect/internal/design-conversation.md` (batched in Step 2)
