# AGENTS.md — Software Factory 26

## About This Factory

Software Factory 26 combines JSM's engineering workflow with Leon van Zyl's production skills. The goal is to build software that ships with confidence, scales with intent, and stays maintainable over time.

## Core Principles

### The Engineer Decides, AI Recommends

Every skill suggests next steps and offers alternatives. None of them makes a call that belongs to you. You are the engineer; the AI is the tool.

### State Lives in Files, Not Chat Sessions

Everything important is written to the repo:
- `docs/scope/` — Feature plans and priorities
- `docs/specs/` — Architecture decisions
- `AGENTS.md` and nested `AGENTS.md` files — Project conventions
- `docs/reviews/` — Code review findings

A session can end, a session can be cleared, and the work is still there because it was never trapped in the conversation.

### Decisions Are Contracts

When `/architect` documents a decision, it becomes the contract the build follows. `/develop` reads the spec and builds to it. If the spec is wrong, you fix the spec first, not the build.

### Load Bearing Decisions Get Written Down

A load bearing decision is one that shapes what gets built without being forced by the requirements. Before building, these get documented in a spec. If you choose to build before deciding, `/develop` records the assumption as an `Assumed` spec that stays flagged until `/architect` ratifies it.

## Workflow Tiers

Each project picks a tier that sets the suggested rigor:

| Tier | Path | When to Use |
|------|------|-------------|
| Prototype | `/develop` only | Throwaway experiments, personal projects |
| Alpha | `/develop` → `/check verify` | Low risk features, internal tools |
| Beta | `/develop` → `/check verify` → `/test` | Most real products |
| GA | Full chain | High risk, payments, compliance, team codebases |

A tier is a suggestion, not a gate. You can mark `done` when you decide it is done.

## Skills by Phase

### Foundation Phase
Run first for new projects or when onboarding to an existing codebase.

- `/scope` — Turn the idea into an ordered plan
- `/audit` — Bootstrap the context files from the codebase
- `/architect` — Document load bearing decisions as specs

### Build Phase
Run when building features.

- `/develop` — Build from a spec
- `/check verify` — Run the app and prove it works
- `/check review` — Fresh model reads the diff
- `/test` — Write regression tests

### Production Phase
Run when scaffolding or shipping.

- `/start-app` — Discovery interview + scaffold
- `/review-app` — OWASP + SEO + drift checks
- `/deploy-app` — Zero to production

### Iteration Phase
Run when automating the feedback loop.

- `/create-factory` — Set up issue → PR pipeline

### Maintenance Phase
Run when fixing or documenting.

- `/debug` — Find and fix the root cause
- `/document` — PR body, changelog, release notes
- `/sync` — Bring docs back in line with code

## Output Style

All skills produced by this factory follow the JSM output style:

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

When on, `/develop` will:
- Check you're not behind the shared branch before building
- Warn about uncommitted work in the area you're about to touch
- Create a branch before building
- Commit as milestones land

## Nested Context

This is the root `AGENTS.md`. If an area of the codebase has its own conventions, add a nested `AGENTS.md` inside that folder. Skills read the nearest one, so local rules override root rules when they need to.

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

- [SYNTHESIS.md](SYNTHESIS.md) — The combined vision and architecture
- [workflow-guide.md](https://github.com/jsmastery-pro/skills/blob/main/docs/workflow-guide.md) — JSM's workflow guide
