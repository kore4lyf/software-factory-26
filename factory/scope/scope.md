# Scope — Software Factory 26

**Status**: `in-progress`
**Tier**: Beta
**Delivery style**: Thin thread first
**Last updated**: 2024-10-12

## At a Glance

| # | Feature | Status | Needs spec | specced_at | built_at | verified_at |
|---|---------|--------|------------|------------|----------|-------------|
| 1 | Foundation setup | `in-progress` | yes | — | — | — |
| 2 | JSM skills integration | `done` | no | — | — | — |
| 3 | Leon's skills integration | `done` | no | — | — | — |
| 4 | Reference files | `pending` | yes | — | — | — |
| 5 | Initial scope template | `pending` | yes | — | — | — |
| 6 | Documentation | `pending` | no | — | — | — |

**Telemetry:** `specced_at` written by /architect at spec capture. `built_at` written by /develop at build complete. `verified_at` written by /check verify at verification pass. Never entered manually. Cycle time = verified_at minus specced_at.

## Foundation Setup

### What this is
Set up the software factory itself as the first product, so it can build everything that comes after.

### Requirements
1. Skills directory structure with foundation, build, production, iteration, maintenance phases
2. Reference files from Leon's skills
3. Root AGENTS.md and CLAUDE.md
4. SYNTHESIS.md documenting the combined vision
5. factory/scope/ and factory/specs/ directories

### Milestones
- [x] Clone JSM skills
- [x] Clone Leon's skills
- [x] Create directory structure
- [x] Copy skills to appropriate phases
- [x] Copy reference files
- [x] Create AGENTS.md
- [x] Document the vision (shipped as ARCHITECTURE.md, not SYNTHESIS.md)
- [ ] Write initial scope template
- [ ] Write SPEC-0001 for the architecture decision
- [x] Create factory/reviews/ directory
- [x] Create factory/ directory (replaced `.workflow/`, removed 2026-10-18)

### Build plan
1. Set up directory structure
2. Copy skills into phases
3. Create root configuration files
4. Document the vision in SYNTHESIS.md
5. Create scope template
6. Commit initial state

## JSM Skills Integration

### What this is
Incorporate JSM's engineering workflow skills into the factory.

### Requirements
1. Scope skill in foundation phase
2. Audit skill in foundation phase
3. Architect skill in foundation phase
4. Develop skill in build phase
5. Check skill in build phase
6. Test skill in build phase
7. Debug skill in maintenance phase
8. Document skill in maintenance phase
9. Sync skill in maintenance phase

### Milestones
- [x] Copy scope
- [x] Copy audit
- [x] Copy architect
- [x] Copy develop
- [x] Copy check
- [x] Copy test
- [x] Copy debug
- [x] Copy document
- [x] Copy sync

## Leon's Skills Integration

### What this is
Incorporate Leon van Zyl's production skills into the factory.

### Requirements
1. Start-app skill in production phase
2. Review-app skill in production phase
3. Deploy-app skill in production phase
4. Create-factory skill in iteration phase

### Milestones
- [x] Copy start-app
- [x] Copy review-app
- [x] Copy deploy-app
- [x] Copy create-factory

## Reference Files

### What this is
Create shared reference files that both JSM-style development and Leon-style production can use.

### Requirements
1. Stack defaults (auth, database, email, storage, payments, AI, jobs, MCP)
2. Design system template
3. SEO patterns
4. Legal patterns
5. Operations patterns

**Needs spec:** yes
**Decision seeds:**
- Topic: reference file format and structure for the factory's shared knowledge base
- Options: (a) Markdown pattern files with frontmatter metadata (recommended: simple, readable, no build step) (b) JSON-based structured templates (machine-readable but harder to maintain) (c) TypeScript module exports (type-safe but couples references to code)
- Recommended: Markdown pattern files with frontmatter, because the factory is doc-driven, the files are read by skills at runtime, and markdown is the lowest common denominator that both humans and AI can read and write without tooling

### Milestones
- [ ] Copy Leon's reference files
- [ ] Adapt for JSM output style
- [ ] Create stack.md template
- [ ] Create design.md template

**Decide-upfront complete.** This row has intent, Done when seeds, Needs spec yes, and decision seeds. /architect can write the spec directly from these seeds without a staged interview. /develop can build without a stop-and-ask gate.

## Documentation

### What this is
Complete documentation for the factory.

### Requirements
1. SYNTHESIS.md with combined vision
2. README.md with quick start
3. Scope template
4. Spec template
5. Review template

### Milestones
- [x] Vision document (shipped as ARCHITECTURE.md)
- [x] README.md
- [x] Scope README
- [x] Specs README
- [ ] Review template
- [ ] Workflow guide

## Notes

This scope was created by `/sf-scope` on 2024-10-12. It uses the Beta tier because this is a real product that will be used to build other products.

The delivery style is "thin thread first" — we want to get the factory working end-to-end first, then thicken it with better documentation and reference files.
