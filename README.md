# Software Factory 26

Welcome to Software Factory 26. This factory combines JSM's engineering workflow with Leon van Zyl's production skills.

## Quick Start

For a goal driven run (spec in, product out, no stops):
1. Run `/factory-run` and pick `auto-recommended` or `I decide upfront`
2. If upfront, answer every architect question in one batch, then walk away
3. Get a whole runnable product plus `docs/reviews/factory-log.md` follow ups

For a supervised build:
1. Run `/scope` to plan what to build
2. Run `/architect` to document key decisions
3. Run `/start-app` to scaffold with production defaults
4. Run `/develop` to build features from specs
5. Run `/check verify` to prove it works
6. Run `/test` to write regression tests
7. Run `/deploy-app` to ship to production

## Skills Available

| Phase | Skills |
|-------|--------|
| Foundation | `/scope`, `/audit`, `/architect` |
| Build | `/develop`, `/check`, `/test` |
| Production | `/start-app`, `/review-app`, `/deploy-app` |
| Iteration | `/create-factory`, `/factory-run` |
| Maintenance | `/debug`, `/document`, `/sync` |

## Documentation

- [SYNTHESIS.md](SYNTHESIS.md) — The combined vision and architecture
- [AGENTS.md](AGENTS.md) — Project conventions and context
- [docs/scope/](docs/scope/) — Feature plans
- [docs/specs/](docs/specs/) — Architecture decisions
- [skills/](skills/) — All available skills

## Reading the Codebase

When working on this project:
- Read `AGENTS.md` first for conventions
- Read `docs/scope/` for current priorities
- Read `docs/specs/` for decisions that shape the build
- Skills live in `skills/` and are organized by phase

## State Lives in Files

Everything important is written to files in the repo, not stored in chat sessions. This means:
- State survives session clears
- Teammates can pick up where you left off
- The repo tells the full story

See `SYNTHESIS.md` for the complete architecture.
