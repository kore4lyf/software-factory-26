Reference shapes for writing the scope and the completion report. Rules live in `SKILL.md`.

## What keeps it readable (the format rules)

- **Two parts:** a slim **At a glance** table for a quick scan, then **the plan** as clean feature sections grouped by phase. Build order is just the section order. There is no separate "build order" list to keep in sync.
- **Clean headings.** A heading is `### <N>. <Feature name>` plus a short status word and short tags **only when they carry real information** (`needs a decision`, a per feature approach override, a workflow tier override like `· GA`). Never a pipe delimited metadata row like `Title | P0 | inherit | …`.
- **Each fact appears once.** Intent, the definition of done, tasks, and pointers live in the section; the At a glance table is the quick index. Status is shown in the table and beside the heading, and nowhere else.
- **Only what is set.** No `n/a`, no `inherit`, no empty fields. A pointer line (`spec <n> · code in <path>`) appears **only once those exist**: the spec link added by `/sf-architect` at capture, the code path by `/sf-develop`.
- **A feature grows a defined shape.** It has a one or two line **intent**, a single **Done when:** line (the acceptance criteria seeds), and **checkbox steps**. A **not yet designed** feature has **one box** (its entry command: `/sf-architect` when it `needs a decision`, else `/sf-develop`, or `/sf-audit` for standards & tooling). **When its spec is captured, `/sf-architect` fills in the built ready shape:** `Design it` (ticked) → `Build it: /sf-develop <feature>` with **2 to 5 milestone sub items rolled up from the spec** → `Verify it: /sf-check verify <feature>` → `Test it: /sf-test <feature>`. **The atomic build tasks stay in the spec's `## Build plan`, never here**. The scope carries only the milestone rollup. The next step is always the first unticked box.

## Row validation gate (write time, not discover later)

Every scope row MUST pass this gate before it is written. A row that fails is **refused**, not written with a vague placeholder.

**Required fields for every row:**

| Field | Requirement | Refused when |
|---|---|---|
| **Intent** | 1 to 2 lines: what it is and why it matters | Missing, or a single vague word ("auth stuff") |
| **Done when** | At least one observable outcome seed | Missing, or empty |
| **Needs spec** | Explicit `yes` or `no` | Missing, or "maybe" |

**When `Needs spec: yes`, the row ALSO needs decision seeds:**

| Seed | Requirement | Refused when |
|---|---|---|
| **Decision topic** | The specific load bearing choice (e.g. "which auth provider + session model") | Missing, or too vague to act on |
| **Options considered** | At least two real options the engineer weighed | Missing, or only one option listed |
| **Recommended pick** | The engineer's suggested choice with a one line why | Missing, or no rationale |

A row that has all required fields is **decide-upfront complete**. It flows through `/sf-architect` and `/sf-develop` without a staged interview. The architect writes the spec directly from the seeds; the develop Step 0 gate sees a complete spec and skips the stop-and-ask.

A row that lacks decision seeds but has `Needs spec: yes` is **incomplete**. The scope skill refuses it and asks for the missing seeds at write time, not later.

**Validation happens at write time.** The skill checks every row before writing. If any row fails, the skill reports which row and which fields are missing, and asks for them. No vague rows enter the scope.

## Single file scope

```markdown
# Scope: <Product name>

<One or two plain sentences: what the product is and who it serves.>

**Build approach:** <Tracer Bullet | Skateboard | Facade | Journey> (<one-line principle>).
**Workflow:** <Prototype | Alpha | Beta | GA> (<what runs after develop, e.g. Beta = check verify, then test>). The project default level of rigor. `/sf-architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. `· GA`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/sf-develop` and skip `/sf-architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status | Needs spec | specced_at | built_at | verified_at |
|---|---------|-------|--------|------------|------------|----------|-------------|
| 1 | Stack & architecture | Foundation | in-progress | yes | 2026-10-12 | — | — |
| 2 | Coding standards & tooling | Foundation | planned | no | — | — | — |
| 3 | Data model | Foundation | in-progress | yes | 2026-10-12 | — | — |
| 4 | Design system & UI foundation | Foundation | planned | yes | — | — | — |
| 5 | Core standup loop | Slice 1 | planned | yes | — | — | — |
| 6 | Daily reminders | Slice 2 | planned | yes | — | — | … |
| … | … | … | … | … | … | … | … |

**Telemetry fields** (`specced_at`, `built_at`, `verified_at`): written automatically by the skill that owns the transition. `/sf-architect` writes `specced_at` when the spec is captured. `/sf-develop` writes `built_at` when the feature is built. `/sf-check verify` writes `verified_at` when the feature passes verification. Never entered manually. A `—` means that transition has not happened yet. Cycle time = `verified_at - specced_at` (or `built_at - specced_at` for features that do not require verification).

## Foundations

### 1. Stack & architecture · in-progress
Decide the stack and scaffold a runnable project so every later slice builds on real structure.
**Done when:** the stack is recorded in a spec and the empty scaffold boots locally and passes build.
- [x] Decide the stack (spec): `/sf-architect stack & architecture`
- [x] Scaffold from the decision: `/sf-develop stack & architecture`
- [ ] Smoke-check it runs: `/sf-test`
Spec 0001 · code in `./`

### 2. Coding standards & tooling
Capture conventions, then install lint, format, and pre-commit enforcement from the real scaffolded project.
**Done when:** root `AGENTS.md` reflects the real stack, and lint/format/pre-commit run clean.
**Needs spec:** no (pure implementation, stack already decided)
- [ ] Capture conventions + tooling choices: `/sf-audit`
- [ ] Install the tooling: `/sf-develop tooling`
- [ ] Check it runs clean: `/sf-test`

### 3. Data model · in-progress
<!-- DESIGNED: /sf-architect captured spec 0002 and filled in the shape below. The 2 to 5 boxes under
     "Build it" are a ROLLUP of the spec's ## Build plan: every table, column, and policy lives in
     the spec, NOT here. This is what a feature looks like right after its spec is captured. -->
Core entities every feature builds on: users, teams, memberships, standup entries, template.
**Done when:** entities and relationships support later slices (reminders, templates, history) without a breaking migration.
- [x] Design it (spec): `/sf-architect data model`
- [ ] Build it: `/sf-develop data model`
   - [ ] Schema + constraints: tables, keys, unique/check, cascades (AC-1..6)
   - [ ] Row-level security: per-table policies + helpers (AC-7..9)
   - [ ] Apply migration, confirm live, generate types (AC-1..9)
- [ ] Verify it: `/sf-check verify data model`
- [ ] Test it: `/sf-test data model`
Spec 0002 · code (filled by /sf-develop)

### 4. Design system & UI foundation · needs a decision
Visual language, layout primitives, and base components so the flows feel cohesive and accessible.
**Done when:** `design.md` covers type/color/spacing/components, and base components handle focus and keyboard.
**Needs spec:** yes
**Decision seeds:**
- Topic: design system direction and component inventory
- Options: (a) Tailwind + shadcn/ui component primitives (recommended: matches stack, fast to build) (b) custom design system from scratch
- Recommended: Tailwind + shadcn/ui, because the stack already uses it and it provides accessible primitives out of the box
- [ ] Design it (spec): `/sf-architect design system & UI foundation`

## Slice 1: Core standup loop

### 5. Core standup loop · needs a decision
Sign in, create a team, submit today's update on the default template, read the team feed. Nothing else yet. This slice is the walking skeleton.
**Done when:** a user can sign in, create a team, submit one standup a day, and see the team's updates for today.
- [ ] Design it (spec): `/sf-architect core standup loop`

## Slice 2: Daily reminders

### 6. Daily reminders · needs a decision
Nudge members who have not submitted before a team cutoff, so daily standup becomes a habit.
**Done when:** unsubmitted members get a timezone-aware reminder before cutoff, and submitters are not nagged.
- [ ] Design it (spec): `/sf-architect daily reminders`

## Deferred
Out of scope for the current build pass, kept so the plan stays honest.
- **Email invites**: invite teammates by email · needs a decision
- **Billing & plans**: free and paid tiers · needs a decision · GA
- **Chat integrations**: post standups to team chat · needs a decision
- **Product analytics**: measure signups and habit · needs a decision

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally, `Decide the stack (spec)` on Stack & architecture), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/sf-architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/sf-scope` | one box: `Design it (spec): /sf-architect <feature>` |
| `in-progress` (designed) | **`/sf-architect` at spec capture** | `Design it` ticked; spec linked; `Build it: /sf-develop <feature>` + **2 to 5 milestones**; the tier's closing boxes (`Verify it` Alpha+, `Test it` Beta+, `Review it` + `Document it` GA); any surfaced follow-up enrolled; `specced_at` written |
| `in-progress` (building) | `/sf-develop` | milestone sub-boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/sf-check verify` | `Build it` + milestones ticked; `Verify it` ticked; `built_at` and `verified_at` written |
| `done` | **you, when you decide it is** (any skill sets it when you say so); `/sf-sync` reconciles | boxes you ran ticked, skipped ones marked skipped; the tier's last stage (`Prototype` → after `/sf-develop`; `Alpha` → after `/sf-check verify`; `Beta`/`GA` → after `/sf-test`) is the suggested point to call it done; `/sf-sync` captures conventions |

**Telemetry timestamps** (`specced_at`, `built_at`, `verified_at`): written by the owning skill, never manually.

| Field | Written by | When |
|---|---|---|
| `specced_at` | `/sf-architect` | Spec is captured and linked to the feature |
| `built_at` | `/sf-develop` | Feature build is complete and self-checked |
| `verified_at` | `/sf-check verify` | Feature passes verification |

Cycle time = `verified_at - specced_at` (or `built_at - specced_at` for features that do not require verification). No dashboard required yet. The timestamps are written to the At a glance table automatically.

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/sf-architect` first; otherwise straight to `/sf-develop` (or `/sf-audit` for standards & tooling). The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre-workflow) and `dropped` (de-scoped, kept for history).
- **Approach tag** beside a heading (e.g. `· Facade`) overrides the project default for that feature; no tag = inherits it.
- **Workflow tier tag** beside a heading (e.g. `· GA`, `· Prototype`) sets that one feature's rigor above or below the project default; no tag inherits the default. It decides the feature's check boxes and each skill's next suggestion.
- **Workflow** (header line) is the project default, what runs after `/sf-develop`: **Prototype** = nothing (trust develop's own build time self check); **Alpha** = `/sf-check verify`; **Beta** = `/sf-check verify` then `/sf-test`; **GA** = adds a fresh model `/sf-check review` then `/sf-document`. A feature built on an unratified decision (an `Assumed` spec) stays flagged, but that never blocks `done`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/sf-architect`, the code path by `/sf-develop`.
```

## Brownfield enrollment

Already built features are enrolled **for context**, above the planned ones, with status `existing` (complete, no task list) or `in-progress` (partial, finish via `/sf-develop`), each with a code pointer. They also appear in the At a glance table.

```markdown
### A. Auth · existing
Pre-workflow auth: sign in, sessions, reset. code in `src/auth/`

### B. Product catalog · in-progress
Partial catalog; finish the remaining pieces via /sf-develop. code in `src/catalog/`
```

`existing` is not `done`: it predates the workflow, so `/sf-develop` and `/sf-sync` leave it alone.

## Large product: epic split

When `scope.md` outgrows a comfortable scan (roughly a dozen plus features across clearly distinct areas), split by epic: **rename `scope.md` to `factory/scope/index.md`** (keep the At a glance table across all epics + a one line status rollup per epic, each linking its file), and **move each area's feature sections out into its own `factory/scope/<epic>.md`**. Promote **on demand**; don't split a small product early. File names are always **semantic** (`scope.md` / `index.md` / `<epic>.md`), never numbered. In a monorepo, each workspace gets its own `factory/scope/<workspace>/` the same way, with a top level `factory/scope/index.md` mapping the workspaces (one line + rollup each).

## Completion report block

Lead with what the pass produced and the first step; the approach, tier, and full list are in the scope file itself (per `factory/conventions.md`). Template:

```
## /sf-scope <plan | replan | add> Â· <product, one line>

**<N> features planned (<M> already on the scope, <K> deferred), build approach <name>, workflow <tier>.**
Next: /clear, then <the first unticked box, usually `/sf-architect <first feature>`, or `/sf-audit` if a brownfield repo has no root AGENTS.md>
Heads up: <a feature bumped to a higher tier, a `needs a decision` foundation, or a genuine risk>   (omit if none)
Scope written to <factory/scope/scope.md>.
```

_Context hygiene: the scope, the specs, and `AGENTS.md` are the durable state, so the workflow hands off through files, not the chat. Advise `/clear` between units (after `/sf-scope`, after each `/sf-architect`, between features) and `/compact` mid unit if one run gets long. On Claude Code use `/clear` / `/compact`; use your agent's fresh session equivalent elsewhere._
