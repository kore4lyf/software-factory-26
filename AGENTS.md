# AGENTS.md — Software Factory 26

## About This Factory

Software Factory 26 is a structured system for building software that ships with confidence, scales with intent, and stays maintainable over time. It combines engineering rigor with production-ready automation.

## This Factory Is Made Of Skills

Every skill below lives in `skills/<name>/` and is an installable Agent Skill. Nothing here runs until it is installed. If a skill seems missing, it has not been installed yet:

```bash
npx skills add . --list                 # see what is available
npx skills add . -g -a opencode -y       # install globally, every project
```

All 14 skill names carry an `sf-` prefix so they never collide with same named skills already on the machine. The layout under `skills/` is deliberately flat, one directory per skill. A nested phase layout does not survive the installer, so the phase grouping below is documentation only, not a folder structure.

## Core Principles

### The Engineer Decides, AI Recommends

Every skill suggests next steps and offers alternatives. None of them makes a call that belongs to you. You are the engineer; the AI is the tool.

### The Write Rule

**Nothing is ever written inside a skill folder.** The skills are installed outside the project, shared across every project on the machine, and rewritten on the next reinstall. A write there breaks every other project using them and disappears without warning. Treat every skill directory as read only, always.

Be blunt about the trap: a sub agent that just read its brief from the install directory has that directory as the freshest path in its context, and it looks like a reasonable place to leave a note. It is not.

**Writable, and nothing else:**
- `factory/` at the project root. The only factory artifact root, always. It is a dedicated folder, so there is no docs site detection and no alternative base
- the product source tree, for code a build actually owns
- `AGENTS.md` and `CLAUDE.md` at the project root, and only through `/sf-sync`

The factory's own engineering history, the record of how the skills themselves evolved, lives in `FACTORY-LOG.md` in the factory source repo. It is never copied into a consuming project, because a stale copy is worse than none.

## State Lives in Files, Not Chat Sessions

Everything important is written to the repo:
- `factory/scope/` — Feature plans and priorities
- `factory/specs/` — Architecture decisions
- `factory/runs/<run-id>.md` — Per run state, written as the run goes
- `factory/deploy-ledger.md` — Deploy and rollback events
- `AGENTS.md` and nested `AGENTS.md` files — Project conventions
- `factory/reviews/` — Code review findings

A session can end, a session can be cleared, and the work is still there because it was never trapped in the conversation.

### Decisions Are Contracts

When `/sf-architect` documents a decision, it becomes the contract the build follows. `/sf-develop` reads the spec and builds to it. If the spec is wrong, you fix the spec first, not the build.

### Load Bearing Decisions Get Written Down

A load bearing decision is one that shapes what gets built without being forced by the requirements. Before building, these get documented in a spec. If you choose to build before deciding, `/sf-develop` records the assumption as an `Assumed` spec that stays flagged until `/sf-architect` ratifies it.

## Workflow Tiers

Each project picks a tier that sets the suggested rigor:

| Tier | Path | When to Use |
|------|------|-------------|
| Prototype | `/sf-develop` only | Throwaway experiments, personal projects |
| Alpha | `/sf-develop` → `/sf-check verify` | Low risk features, internal tools |
| Beta | `/sf-develop` → `/sf-check verify` → `/sf-test` | Most real products |
| GA | Full chain | High risk, payments, compliance, team codebases |

A tier is a suggestion, not a gate. You can mark `done` when you decide it is done.

## Skills by Phase

### Foundation Phase
Run first for new projects or when onboarding to an existing codebase.

- `/sf-scope` — Turn the idea into an ordered plan
- `/sf-audit` — Bootstrap the context files from the codebase
- `/sf-architect` — Document load bearing decisions as specs

### Build Phase
Run when building features.

- `/sf-develop` — Build from a spec
- `/sf-check verify` — Run the app and prove it works
- `/sf-check review` — Fresh model reads the diff
- `/sf-test` — Write regression tests

### Production Phase
Run when scaffolding or shipping.

- `/sf-start-app` — Discovery interview + scaffold
- `/sf-review-app` — OWASP + SEO + drift checks
- `/sf-deploy-app` — Zero to production

### Iteration Phase
Run when automating the feedback loop.

- `/sf-create-factory` — Set up issue → PR pipeline
- `/sf-factory-run` — Spec in, product out. Goal driven run with no mid build stops. This is the ONLY entry point for a full product run.

### Maintenance Phase
Run when fixing or documenting.

- `/sf-debug` — Find and fix the root cause
- `/sf-document` — PR body, changelog, release notes
- `/sf-sync` — Bring docs back in line with code

## Orchestration Rules

**factory-run is the only entry point for a full product run.**

When receiving a product idea:
1. Load `/sf-factory-run`, then read `skills/sf-factory-run/agents/orchestrator.md` before dispatching anything
2. You are the orchestrator. You read, decide, dispatch, and record. You do not audit, scope, architect, develop, verify, test, review, document, or sync yourself
3. factory-run spawns one sub-agent per role, each carrying a brief from `skills/sf-factory-run/agents/`: `audit-agent`, `scope-agent`, `architect-agent`, `develop-agent`, `verify-agent`, `test-agent`, `review-agent`, `document-agent`, `sync-agent`
4. Each sub-agent loads its own skill by ID (`sf-scope`, `sf-architect`, and so on) and never asks the engineer a question. Open decisions come back as written assumptions
5. Individual skills are invoked by those sub-agents, not called directly during a product run

**The scope is the work queue.** You never remember what comes next, you read it. Each feature row in `factory/scope/scope.md` carries boxes (`Design it`, `Build it`, `Verify it`, `Test it`, `Review it`, `Document it`), and **the first unticked box is the instruction**: dispatch the skill it names. The workflow tier decides which boxes exist on a row at all, so you never dispatch a check the row does not ask for.

**Never do the work inline.** Loading a worker skill yourself and executing it in the main thread is the failure mode this whole design exists to prevent. It gives up isolation, parallelism, and context separation all at once, and it is not a factory run.

**Commit at every verified feature boundary.** After a feature's checks pass, and before the next build is dispatched, commit the tree and write the SHA into `factory/runs/<run-id>.md`. A verified feature is the rollback point; developing the next feature without it leaves no way back to the last state anyone proved worked. This runs regardless of the `## Git` setting below, which governs whether individual skills manage branches, not whether a factory run keeps a rollback point.

**The loop is three nested scopes, not a pipeline:**

| Scope | Skills, in order |
|---|---|
| Per project, once | `sf-audit` then `sf-scope` |
| Per feature, in scope order | `sf-architect` → `sf-develop` → `sf-check verify` (Alpha+) → `sf-test` (Beta+) → `sf-check review` (GA) → `sf-document` (GA) |
| Per change, around merge | `sf-check review` → `sf-document` → `sf-deploy-app` (GA) → `sf-sync` |
| Anytime, on failure | `sf-debug`, off rail, no row or spec needed |

Do not hang `sf-audit` off feature rows (it runs once), and do not hang `sf-check review`, `sf-document`, `sf-deploy-app` or `sf-sync` off them either (they read a diff and a merge, so one change gets one of each). Ship never runs inside a sandbox: a factory worker holds no production credentials, and its change ends at the pull request.

**Parallel vs sequential:**
- Audit and scope run before anything reads the codebase
- **Architect fans out.** One sub-agent per feature, every spawn in a single message, and that is the only fan out. They write to separate spec files and touch no product code, so they cannot collide
- **Develop is strictly sequential.** One feature at a time, through its own verify and its own test, then the next. This is what makes the commit checkpoint mean anything: one feature's verified state exists in the tree before the next one starts, so the rollback point is a real state rather than two half finished builds mixed together
- Review, document, deploy and sync run once per change, sequentially, around merge

## Output Style

All skills produced by this factory follow this style:

- Plain words, no jargon where simpler terms exist
- No dashes as punctuation (use commas, parentheses, or reword)
- Talk to the user as "you", warm and direct
- Short sentences, clear beats clever
- Code and paths keep their hyphens

## Convocations

Skills should communicate by writing to the terminal, not asking questions unless they need a real decision. Questions without options belong in a report, not a prompt.

## Git Integration

Git integration is off by default in this repo. If you want the factory to manage branches and commits, add this section:

```
## Git
integration: on
```

When on, `/sf-develop` will:
- Check you're not behind the shared branch before building
- Warn about uncommitted work in the area you're about to touch
- Create a branch before building
- Commit as milestones land

## Nested Context

This is the root `AGENTS.md`. If an area of the codebase has its own conventions, add a nested `AGENTS.md` inside that folder. Skills read the nearest one, so local rules override root rules when they need to.

## Factory Run Mode

When `/sf-factory-run` is active, its rules override the base skills for that run:

1. Architect everything once before any build. No per feature stops.
2. No `Architect it first` hard stop inside the run. New gaps become `Assumed` appendices, build continues.
3. No `blocked` status. Missing keys, broken packages, failing installs get a stub behind the same interface, logged in `factory/runs/<run-id>.md`.
4. Product is whole and runnable at the end. Follow ups are small (wire real key, swap stub, ratify spec).

## Reference Files

Shared reference files live in `/references/`. These contain:
- `stack.md` — Technology stack defaults
- `auth.md` — Authentication patterns
- `database.md` — Database and ORM patterns
- `email.md` — Email service patterns
- `storage.md` — File storage patterns
- `payments.md` — Payment integration patterns
- `ai.md` — AI feature patterns
- `jobs.md` — Background job patterns
- `mcp.md` — MCP/agent access patterns
- `legal.md` — Legal page patterns
- `seo.md` — SEO patterns
- `ops.md` — Operations patterns

## See Also

- [ARCHITECTURE.md](ARCHITECTURE.md) — The vision and architecture
