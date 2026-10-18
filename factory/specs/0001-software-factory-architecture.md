# 0001 · Software Factory Architecture

**Status**: Proposed
**Date**: 2024-10-12
**Author**: Software Factory 26

## Summary

Adopt a two-layer architecture that combines JSM's engineering workflow (strategic layer) with Leon van Zyl's production skills (environment + process layer) to create a software factory that produces maintainable, production-ready software.

## Context

Two approaches were studied:

**JSM's engineering workflow** provides:
- Phase-based workflow (scope → architect → develop → check → test → document → sync)
- Decision documentation via specs
- Acceptance criteria that flow from spec through build to verification
- Workflow tiers (Prototype/Alpha/Beta/GA) for appropriate rigor
- State lives in files, not chat sessions
- Nested AGENTS.md for area-specific conventions

**Leon van Zyl's production skills** provide:
- start-an-app — Discovery interview + scaffold with production defaults
- review-an-app — OWASP + SEO + drift checks
- deploy-an-app — Zero-to-production with correct infrastructure
- create-upstash-software-factory — Issue → PR pipeline via sandboxed workers

Neither approach alone covers the full lifecycle. JSM ends at documentation; Leon lacks structured decision-making before building. Combining both fills the gaps.

## Decision

Adopt a two-layer architecture:

### Layer 1: Strategic Layer (JSM)

Documents the "what" and "why":
- `factory/scope/` — Feature plans and priorities
- `factory/specs/` — Architecture decisions
- `AGENTS.md` — Project conventions and context
- `design.md` — UI/UX direction

Owned by: `/sf-scope`, `/sf-architect`, `/sf-audit`, `/sf-sync`

### Layer 2: Environment + Process Layer (Leon)

Executes the "how":
- `/start-app` — Discovery + scaffold
- `/sf-develop` — Build from spec
- `/review-app` — Quality gates
- `/sf-deploy-app` — Production delivery
- `/create-factory` — Iteration automation

Owned by: skills, CI/CD, agents

## Skills Organization

| Phase | Skills | Purpose |
|-------|--------|---------|
| Foundation | scope, audit, architect | Bootstrap decisions |
| Build | develop, check, test | Feature delivery |
| Production | start-app, review-app, deploy-app | Ship to users |
| Iteration | create-factory | Automate feedback |
| Maintenance | debug, document, sync | Keep healthy |

## Workflow

```
Idea → /scope → /architect → /start-app → /develop → /check verify → /test → /deploy-app → /document → /sync
                                                        ↓
                                                    /check review
                                                        ↓
                                               /create-factory (when ready)
```

## Consequences

### Positive
- Engineering rigor (JSM) combined with production automation (Leon)
- Decisions documented before code is written
- State survives session clears
- Automated iteration via software factory
- Appropriate rigor per project tier

### Negative
- More upfront structure than a simple scaffold
- Skills must be maintained in sync
- Two layers require coordination

### Neutral
- Skills live in `/skills/` directory
- Reference files live in `/references/` directory
- Project docs live in `/docs/` directory
- Reviews live in `/factory/reviews/`

## Alternatives Considered

### JSM Only
Pros: Clean workflow, proven system
Cons: No production deployment, no iteration automation

### Leon Only
Pros: Fast scaffold, production-ready defaults
Cons: No structured decision-making, no verification rigor

### Custom Hybrid
Pros: Fully tailored to needs
Cons: Reinventing wheels that both systems have already solved

## Requirements

This spec implements the following requirements:
1. Combine JSM workflow with Leon's production skills
2. State lives in files, not chat sessions
3. Decisions documented before building
4. Appropriate rigor per project tier
5. Automated iteration via software factory

## See Also

- [ARCHITECTURE.md](../../ARCHITECTURE.md) — The combined vision
- [AGENTS.md](../../AGENTS.md) — Project conventions
