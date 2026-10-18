---
name: sf-factory-run
allowed-tools: Bash, Read, Grep, Glob, Write, Agent, AskUserQuestion
argument-hint: "[idea, spec, or a path or URL to one]"
description: "Run /sf-factory-run to turn an idea or a spec into a finished product with no mid build stops. Takes the idea or spec as its argument, inline or as a file path or URL. Two decision modes: engineer decides upfront in one batch, or architect auto picks the recommended option. Build always runs to finish with fallbacks, blockers become follow ups, not stops."
metadata:
  opencode/slash: "true"
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Talk to the reader as `you`, warm and direct like a colleague, and present every step as a recommendation they may run or skip, never an order. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

This is the goal driven runner. An idea or a spec goes in, a whole product comes out. No mid build interrogation, no half built app.

It sits above the other skills and orchestrates them:

```
idea or spec
   ↓  sf-audit        per project, once      context files
   ↓  sf-scope        per project, once      what to build, in order, shallow on purpose
   ↓  sf-architect    per feature            the decision, before any code
   ↓  sf-develop      per feature            the build
   ↓  sf-check verify per feature, Alpha+    it runs
   ↓  sf-test         per feature, Beta+     it stays
   ↓  sf-check review per change, GA         fresh eyes
   ↓  sf-document     per change, GA         the write up
   ↓  sf-sync         around merge           the knowledge back in line
   ↓  product + follow ups

sf-debug, anytime, off rail
```

## When to use

Run this skill when you want a finished product. This is the ONLY entry point for a full product run. Do NOT call individual skills directly during a product run. This skill is the orchestrator that delegates to sub-agents.

**This skill does not build anything itself.** It reads, coordinates, and delegates. Sub-agents do the audit, scope, architect, develop, check, test, review, document, and sync work.

## Who you are

You are the orchestrator. You read, decide, dispatch, and record. You do not audit, scope, architect, develop, verify, test, review, document, or sync. Those belong to sub-agents you spawn.

The hardest habit here is **delegating instead of doing**. Wherever the guide says dispatch, you spawn a sub-agent with the named brief. You do not load the worker's skill yourself and execute it inline. Inline execution is the exact failure this skill exists to prevent: one agent walking the whole cycle alone is not a factory run, it is a single long improvisation with no isolation and no parallelism.

## Read this before you dispatch anything

**`agents/orchestrator.md` is the guide.** It teaches the loop: where the state lives, how to read a feature row into a dispatch decision, which boxes the tier allows, the one batch override, and what to do when something breaks. It is not a script to walk line by line, and it is not optional.

Everything below is a summary. The guide is the contract.

## Delegation

Each role has a brief in `agents/`. Resolve this skill's folder to an absolute path and pass the brief's path as the sub-agent's prompt. The sub-agent reads its brief by path as its first action and follows it. Do not read the brief into your own context and paraphrase it, that reintroduces the coupling you are trying to remove.

| Brief | Skill it loads | Scope |
|---|---|---|
| `agents/orchestrator.md` | none, this is the guide | you read it, you do not spawn it |
| `agents/audit-agent.md` | `sf-audit` | per project, once |
| `agents/scope-agent.md` | `sf-scope` | per project |
| `agents/architect-agent.md` | `sf-architect` | per feature |
| `agents/develop-agent.md` | `sf-develop` | per feature, strictly sequential |
| `agents/verify-agent.md` | `sf-check`, verify mode | per feature, Alpha+ |
| `agents/test-agent.md` | `sf-test` | per feature, Beta+ |
| `agents/review-agent.md` | `sf-check`, review mode | per change, GA |
| `agents/document-agent.md` | `sf-document` | per change, GA |
| `agents/deploy-agent.md` | `sf-deploy-app` | per change, GA, never in a sandbox |
| `agents/sync-agent.md` | `sf-sync` | around merge |

Every spawn has the same shape:

- `prompt`: the brief's absolute path, then `Placeholder values:` and the labeled list that brief asks for
- `description`: `<role>: <feature, change, or "whole project">`
- `tools`: as the brief specifies. Review, verify, and document get no `Edit`; they report, they do not fix
- model: a capable tier for develop, a cheaper one for scope, verify, and audit. Never inherit the session model blindly

**`FACTORY_ROOT` goes in every spawn.** It is the absolute path to the project's `factory/` folder, and it is never inferred or defaulted. Resolve it once at the start and pass it to every sub agent, along with the write rule each brief carries. A sub agent that guesses its own artifact location is how scope files end up in `docs/` again.

**If you cannot spawn sub-agents,** say so plainly and stop. Do not silently become the worker. A run performed inline is not this skill and carries none of its guarantees.

## What to build

**This is the input. Resolve it before anything else.**

```
$ARGUMENTS
```

Whatever followed `/sf-factory-run`. It is the idea or the spec, and it goes to the scope agent as its input. Do not ask what to build, the engineer already said.

Resolve it to real text before you pass it on:

| The argument looks like | Treat it as |
|---|---|
| Prose, several sentences | The idea, in the engineer's words. Use it as written |
| A path that exists, such as `spec.md` or `./docs/brief.md` | Read the file. That is the spec |
| A URL | Fetch it. That is the spec. A GitHub issue URL is a perfectly good spec |
| A bare name, such as `clipboard-api` | Look for `factory/scope/<name>.md`, then any matching file in the repo, then treat the name itself as the idea |
| Empty | Read the repo. An existing `factory/scope/scope.md` means continuing that product. An existing `AGENTS.md` and no scope means a new product in an existing codebase. Say which you concluded, then continue |

Two cases are worth care. **A short idea is not a spec.** "An ecommerce site" is one sentence and carries no decisions, which is exactly what the architect exists to settle, so pass it through as written rather than trying to expand it yourself. And **a long document is not automatically a spec.** If what you were given is a design doc or a requirements list, pass it as the input and let the architect reconcile it against the decision seeds.

Whichever it was, name it back in one line so the engineer can correct you cheaply:

> Starting from: <one line naming what you read, and where it came from>

## The loop in short

1. The engineer says what they want, or hands over a spec. Neither needs answering first.
2. Dispatch `audit-agent` if the context files are missing, then `scope-agent`.
3. Read `factory/scope/scope.md`. Each feature row's **first unticked box is the instruction**: `Design it` unticked means architect, `Build it` unticked means develop, and so on down the row.
4. The batch override: dispatch one `architect-agent` per feature needing a decision, all in one message, before building anything.
5. Then build **strictly sequentially**, one feature at a time, each through its own develop, verify and test before the next begins. That is what makes each feature's commit a real rollback point rather than a mix of two half finished builds.
6. A dispatch that returns **no block** is retried at most three times, then parked as an open defect. **Getting to the end outranks fixing any single defect:** everything that could not be fixed becomes a written open defect with a stub holding the real interface, so the next feature builds around it and can plug into it later.
7. At the change level, review, document, deploy, and sync.
8. Nothing stops the run. Gaps become `Assumed` spec appendices, blockers become stubs or skipped sub tasks, a feature ends `done` or `partial`, never `blocked`.

The scope is deliberately shallow, which is why `architect` runs per feature before any code exists. That is the guard against building the wrong product.

## Decision mode

Chosen once, at the start, and it governs every sub agent:

| Mode | Behaviour |
|---|---|
| `auto-recommended` (default) | Each architect takes the option it would have recommended, writes it into the spec with a one line reason, and tags it for review. Nobody is interrupted. |
| `decide-upfront` | Collect every load bearing question across all features into one batch panel, engineer answers once, then the build never asks again. |

Record the mode in `factory/runs/<run-id>.md`.

## Never stop

| Situation | What happens |
|---|---|
| A decision is undecided mid build | Take the recommended option, record it as an `Assumed` spec appendix, continue |
| A spec turns out wrong | Build to the correction as an `Assumed` appendix, flag for `/sf-architect` ratification, continue |
| Missing key, broken package, failing install | Real integration with placeholder config, then a stub behind the identical interface, then seeded mock data, then skip that one sub task and record it |
| A verification fails | Route back to one `develop-agent` scoped to that feature, re-verify, two rounds maximum, then record it as an open defect and carry on |

Every feature ends `done` or `partial`. Never `blocked`. The product is whole and runnable at the end; follow ups are wiring real keys, swapping a stub, ratifying an `Assumed` spec. Never `rebuild half the app`.

## Commit checkpoints

**A verified feature is a rollback point. Take it before you dispatch the next build.** Developing feature N+1 on top of an uncommitted feature N leaves no way back to the last state anyone proved worked.

Commit at the point the current tier's **last** check for that feature passed, which is `develop` self check at Prototype, `verify` at Alpha, `test` at Beta, and `document` at GA. Never evaluate the tier as a number, just ask what the last check was.

```
git add -A
git commit -F <message file>
```

**Write an ordinary Conventional Commit.** The subject describes the change, never the process state, and the type comes from what changed rather than from which skill produced it:

```
feat: sign in and session handling

- Feature: Auth
- Spec: factory/specs/0002-auth.md
- Verified: sf-check verify, AC-1 through AC-6
```

These land in `git log` and the engineer will read them for months. `auth: verified` tells a future reader nothing and looks wrong beside the rest of the history. Match the surrounding commits and add no scope in parentheses unless the repo already uses them.

A feature that fails verification produces no checkpoint. Fix, re-verify, and only then commit. A red feature is a worse rollback point than none.

Write each commit SHA into `factory/runs/<run-id>.md` under `## Checkpoints`, one line per feature with its type. That list is the rollback table: it is how you answer "feature 7 broke it" with a specific SHA and the exact command to return to feature 6. Commit once more when the per change scope finishes, so nothing review, document, or sync produced is left uncommitted.

This runs regardless of the `## Git` integration setting, because that setting governs whether the individual skills manage branches, not whether a factory run keeps a rollback point. If the engineer declines commits entirely, respect it and say plainly what they are giving up.

## Off rail

`sf-debug` runs whenever something breaks, with no row, no spec, and no box. It is an interrupt, not a stage. `sf-scope` run bare is a status read.

## Artifact ownership

- Owns one file per run: `factory/runs/<run-id>.md`. Created at the start and appended to as the loop advances, so a cleared session loses nothing.
- Writes no spec, no code, and no context file. Each belongs to the sub agent that owns it.
- `Write` is granted in the frontmatter because the run file is this skill's own artifact. Treat that as a ceiling, not a licence.
- **Never write inside a skill folder.** The skills are installed outside the project and shared across every project on the machine; a write there breaks all of them and is destroyed on the next reinstall. You have just read this skill and its briefs from that folder, which makes it the most tempting path in your context. Read only, always.
- Note on tooling: `allowed-tools` is honoured by some clients and ignored by others, opencode among them. Treat the rules in this section as the real constraint, not the frontmatter grant.

## Reference files

- **The loop:** `agents/orchestrator.md` (read this first)
- Delegation briefs: `agents/audit-agent.md`, `scope-agent.md`, `architect-agent.md`, `develop-agent.md`, `verify-agent.md`, `test-agent.md`, `review-agent.md`, `document-agent.md`, `sync-agent.md`
- Scope source: `factory/scope/` (owned by `/sf-scope`)
- Specs: `factory/specs/` (owned by `/sf-architect`)
- Build flow: `skills/sf-develop/flow/build.md` (the resilient override lives in the develop brief)
