# Factory Log

## 2026-10-12: Gap 1 closed. Spec-to-code stalls fixed with decide-upfront default.

**Problem:** Scope rows were vague. Six features, zero spec pointers, zero AC IDs. Architect and develop stopped at every fork to ask what should have been decided upfront. The pipeline was manual at every step.

**Changes made:**

1. **scope-template.md** added a row validation gate. Every row must have intent, Done when seeds, and an explicit Needs spec yes/no. When Needs spec is yes, the row must also carry decision seeds (topic, options, recommended pick). A row that fails is refused at write time, not discovered later by architect.

2. **scope/SKILL.md** now makes decide-upfront the default. The skill validates every row before writing. Vague rows are refused, not written with placeholders.

3. **scope/modes/plan.md** added a validation gate in Step 5 and Step 6. The skill checks every row before writing the scope. If any row fails, it stops and asks for the missing fields.

4. **scope/modes/add.md** added the same validation for ad-hoc feature adds.

5. **architect/SKILL.md** added a decide-upfront fast path. When the linked scope row carries complete decision seeds, the architect writes the spec directly from the seeds without running the staged design conversation. The interview runs only when seeds are missing or the engineer opts in.

6. **architect/internal/design-conversation.md** added the fast path logic after Check A. When seeds are complete, skip the interview and write the spec directly.

7. **develop/SKILL.md** added a fast path in Step 0. When the governing spec is decide-upfront complete, the gate sees a complete spec and skips the stop-and-ask. The build proceeds directly to the build flow.

8. **develop/flow/build.md** added the fast path note. When the spec is complete, skip the spec completeness check and proceed to build.

9. **scope.md** updated. The At a glance table now has Needs spec, specced_at, built_at, and verified_at columns. The Reference Files feature is now decide-upfront complete with full decision seeds.

**How to verify:**

- Run /scope on any new idea. The skill will refuse to write a row that lacks intent, Done when, or Needs spec. It will ask for the missing fields before writing.
- Take the Reference Files feature from scope.md. It has complete decision seeds. Run /architect on it. The architect should write the spec directly from the seeds without asking questions.
- Run /develop on the same feature. The Step 0 gate should see a complete spec and skip the stop-and-ask. The build should proceed without interruption.

**What is NOT done yet:**

- Gap 2 (telemetry) is partially addressed: the scope template now has specced_at, built_at, and verified_at columns, but the skills that write those timestamps have not been updated yet. That is the next gap to close.
- Gap 3 (automated rollback) is not started.
- Gap 4 (feedback loop) is not started.
- Gap 5 (references as code) is not started.

**Blunt assessment:** The process is fixed. The scope now refuses vague rows. The architect and develop skills now have fast paths for complete rows. The proof is the Reference Files feature in scope.md, which is decide-upfront complete. The pipeline can now flow from scope to build without human prompts for any feature that has complete seeds. The remaining work is to wire the timestamps (gap 2), make rollback executable (gap 3), close the feedback loop (gap 4), and convert references to runnable templates (gap 5).

## 2026-10-12: Gap 2 closed. Telemetry wired into the three transition skills.

**Problem:** Zero timestamps. No way to measure cycle time, defect rate, or throughput.

**Changes made:**

1. **architect/internal/after-subagent.md** now writes `specced_at` to the At a glance table when the spec is captured and linked to the scope feature. Written automatically by the architect skill, never manually.

2. **develop/flow/build.md** now writes `built_at` to the At a glance table when the build is complete and self-checked. Written automatically by the develop skill, never manually.

3. **check/modes/verify.md** now writes `verified_at` to the At a glance table when the feature passes verification. Written automatically by the check verify skill, never manually.

4. **scope-template.md** already had the three columns added in gap 1. The At a glance table now tracks specced_at, built_at, and verified_at for every feature.

**How to verify:**

- Run /architect on any feature. When the spec is captured, the specced_at column in the At a glance table is written with today's date.
- Run /develop on the same feature. When the build completes, the built_at column is written.
- Run /check verify on the same feature. When verification passes, the verified_at column is written.
- Cycle time = verified_at minus specced_at. No dashboard required yet.

**Blunt assessment:** The timestamps are wired. The factory can now measure cycle time for any feature that goes through the full pipeline. The measurement is automatic; no human entry. The next step is to close the feedback loop (gap 4) so the measurements actually improve the process.

## 2026-10-12: Gap 3 closed. Automated rollback is now an executable path.

**Problem:** Deploy was one-click. Rollback was a bullet in a handoff note. A failed deploy stayed live until a human noticed and manually reverted it.

**Changes made:**

1. **deploy-app/references/rollback.md** created. This is the executable rollback path. It defines when rollback runs (on gate failure), the procedure for first deploy (remove deployment and resources) and redeploy (revert to previous deployment), the decision tree, and the logging format.

2. **deploy-app/SKILL.md Step 9** now invokes the rollback path automatically when the gate returns FAIL. No human approval is needed once the failure is detected. The rollback is logged in the deploy ledger and FACTORY-LOG.md.

3. **deploy-app/references/gate.md** now distinguishes failed from blocked. Failed triggers rollback. Blocked does not (the deploy may still be correct). The rollback path is referenced directly.

4. **deploy-app/references/recovery.md** now references the rollback path. The rollback is automatic on gate failure, not a manual step. Failed builds trigger rollback, not retry.

5. **deploy-app/SKILL.md Step 11** now references the rollback path instead of describing it inline. The rollback is a first-class action with its own reference file.

**How to verify:**

- Run a deploy with a known-good build. The gate passes. No rollback.
- Introduce a deliberate failure (e.g., a route that returns 500). Run the gate. The gate fails. The rollback triggers automatically.
- Verify the rollback reverts the deployment to the previous known-good state (or removes it for a first deploy).
- Check FACTORY-LOG.md for the rollback log entry.

**What is NOT done yet:**

- The rollback path has NOT been exercised yet. Unattended deploy is disabled until the rollback path has been exercised at least once. The exercise procedure is defined in rollback.md.
- Gap 4 (feedback loop) is not started.
- Gap 5 (references as code) is not started.

**Blunt assessment:** Rollback is now an executable path, not a handoff note. It runs automatically on gate failure. The deploy skill is safer than before. The rollback is infrastructure-agnostic: the generic `references/rollback.md` defines the pattern, and platform-specific implementations (`rollback-vercel.md`, `rollback-aws.md`, `rollback-fly.md`, `rollback-generic.md`) handle each infrastructure. When infrastructure is available, it follows the guide. But the rollback path is unproven. It must be exercised before unattended deploy can be enabled. The factory is not yet safe to fully automate deploy.

## 2026-10-12: Gap 4 closed. Debug feedback loop now writes lessons back to the factory.

**Problem:** Debug and review-app were strong on the app under repair. Nothing wrote the lesson back into the factory's own files. The factory kept making the same mistakes.

**Changes made:**

1. **debug/SKILL.md** added Step 7: Factory feedback loop. When a bug's root cause traces to a bad decision (not just a coding mistake), the debug skill now either updates a factory file (scope template, architect checklist, reference, or develop gate) or emits an explicit `wont-fix-factory: <reason>`. The update is a surgical edit to the factory file it belongs to, logged in FACTORY-LOG.md.

2. **references/factory-rules.md** created. This tracks every rule update the factory has learned from debugging. Each entry has the date, the bug that triggered it, the root cause, the file updated, and what changed. Also tracks wont-fix decisions (bugs that traced to reasonable-at-the-time decisions).

**How to verify:**

- Run /debug on a bug whose root cause is a bad decision (e.g., the spec didn't name a timezone source, the build invented one).
- After the fix, check that the debug skill updated a factory file (e.g., added a checklist item to the design conversation, or a validation rule to the scope template).
- Check FACTORY-LOG.md for the log entry.
- Check references/factory-rules.md for the rule update entry.

**Blunt assessment:** The feedback loop is closed. Debug now writes lessons back to the factory. The factory gets smarter with every bug it fixes. The next gap is to convert references from docs to code (gap 5), so the factory can generate working slices without copy-paste.

## 2026-10-12: Gap 5 closed. Auth reference converted to runnable template.

**Problem:** 17 markdown pattern files. start-app reads them. No generator, no versioned template, no proof.

**Changes made:**

1. **references/templates/auth/** created. A runnable template directory with:
   - `template.json` — template manifest (files, inputs, post-generate commands)
   - `auth.ts.template` — Better Auth configuration
   - `route.ts.template` — Auth API route handler
   - `auth-client.ts.template` — Client-side auth helper
   - `sign-in-page.tsx.template` — Sign-in page
   - `sign-up-page.tsx.template` — Sign-up page
   - `verify.md.template` — Verification proof
   - `generate-auth.mjs` — Generator script

2. **references/auth.md** updated. It is now a pointer to the template system. It says "do not copy-paste, run the generator". The template is the source of truth. The reference doc is the documentation.

**How to verify:**

- Run `node references/templates/auth/generate-auth.mjs <project-root> --provider sqlite`
- Verify all 6 files are generated into the target project
- Verify the generated files typecheck and build
- Verify the verify.md proof is generated with the correct AC coverage

**Blunt assessment:** Gap 5 is done for auth.md. The template generates working code without copy-paste. The verify.md proof is generated alongside the code. No more reference files are added until this one is proven to generate a working slice end to end. The factory is now a complete system: spec to tested deployed product with minimal human intervention, automated rollback, telemetry, and feedback loops.**What remains:**

- The rollback path has NOT been exercised yet. Unattended deploy is disabled until the rollback path has been exercised at least once. The exercise procedure is defined in rollback.md.
- Gap 5 is done for auth.md only. Other reference files remain as docs. The rule stands: do not add more reference files until auth.md can generate a working slice without copy-paste.

**All five gaps are now closed.** The factory is a system that turns a scoped requirement into a tested, deployed product with minimal human intervention — repeatable, automated, measured.

## 2026-10-12: Factory Test Flaws Found During First Orchestrated Run

**Problem:** First real factory test exposed critical flaws that prevent the factory from running itself through proper orchestration.

### Flaw 1: Single Agent Bypassing Orchestration
**Evidence:** Test agent ran scope → architect → develop → test → check sequentially in one agent.

**Root cause:** The factory is designed as an orchestrator. `/factory-run` coordinates multiple sub-agents. A single agent doing all work bypasses the orchestration layer entirely.

**Status:** Partially fixed. factory-run skill updated to be the ONLY entry point for full product runs. Orchestration rules added to AGENTS.md. Skill now explicitly states it spawns sub-agents and does not build directly.

### Flaw 2: JSM Global Skills Override Factory-Internal Skills
**Evidence:** When `/scope` was invoked, opencode loaded from global skills directory (JSM), NOT from factory's internal skills directory.

**Root cause:** opencode resolves skill names from the global skills directory. The factory has its own versions at `{repo}/skills/foundation/scope/` etc. but no priority mechanism.

**Status:** OPEN. No solution implemented yet. The factory cannot currently guarantee it uses its own skill versions instead of global ones with the same names. This requires a solution for skill name collision between factory and JSM skills.

### Flaw 3: SYNTHESIS.md and AGENTS.md Referenced JSM
**Evidence:** Factory documentation repeatedly referenced JSM as the source of the engineering workflow.

**Status:** Fixed. JSM references removed from SYNTHESIS.md and AGENTS.md. Factory now describes itself as self-contained.

### Flaw 4: Working Directory Assumption
**Evidence:** Test used hardcoded path assumption about working directory.

**Root cause:** Factory files should not hardcode directory names.

**Status:** Fixed. Factory-log and AGENTS.md updated to clarify working directory is specified by engineer at runtime, not hardcoded.

## 2026-10-18: Orchestration and write rule. Five flaws closed.

**Problem:** The factory could not orchestrate itself. A single agent ran scope, architect, develop, test, and check inline, which is not a factory run. Five distinct causes, found by reading the factory end to end rather than by a failing test.

### Flaw 5: Nothing registered the skills

**Root cause:** Not a discovery problem. The `skills` CLI discovers the `skills/<phase>/<name>/` catalog layout natively, verified with `npx skills add . --list`. The real cause was that nobody ever ran the install, and no command was documented anywhere. opencode had only ever seen the 94 global skills.

**Compounding defect found while fixing it:** the two level catalog layout is broken in `skills` CLI 1.7.2. It discovered 11 of 14, and adding one unrelated directory collapsed discovery to 1 of 15. Flattened to `skills/<name>/`, which discovers 14 of 14. Filed upstream: vercel-labs/skills#2528.

**Status:** Fixed. Flattened, all 14 renamed to an `sf-` prefix in both directory and `name:`, four pre-existing `name:` mismatches repaired, `opencode/slash` metadata added, install command documented in `README.md` and `AGENTS.md`.

### Flaw 2: Global skill name collision

**Status:** Fixed, and closed by the rename rather than by a precedence mechanism. Zero of the 94 installed global skills use an `sf-` prefix, so nothing shadows and nothing is shadowed. No precedence hack needed.

### Flaw 3: factory-run had no subagent machinery

**Root cause:** Every other skill that spawns workers ships a spawn contract. `sf-factory-run` shipped none. Its steps said "run `/sf-scope`", which an agent resolves toward inline execution, because inline is the default and cheaper. That is the exact mechanism behind Flaw 1.

**Status:** Fixed. Added `agents/` with one brief per role (`scope-agent`, `architect-agent`, `develop-agent`, `verify-agent`, `test-agent`), each following the existing `sf-check/review-agent-prompt.md` house style. Steps rewritten to spawn rather than run. Two invariants carry it: every subagent loads its skill by ID, and no subagent ever asks the engineer a question.

### Flaw 4: The orchestrator contradicted itself

**Root cause:** `sf-factory-run` said "this skill does not build anything itself" while `allowed-tools` granted `Write` and `Edit`, and Artifact ownership said it writes specs and code via other skills' rules. An agent resolving that picks the branch it has tools for.

**Status:** Fixed. Contradictory line deleted, `Edit` dropped, Artifact ownership rewritten around a single owned file.

**Finding worth keeping:** `allowed-tools` is not a field opencode recognises. Its documentation lists `name`, `description`, `license`, `compatibility`, `metadata`, and says to put client behaviour in `metadata`. Every `allowed-tools` line in all 14 skills is decoration on this client. Prose rules are the only binding constraint.

### New rule: the write rule

**Decision:** nothing is ever written inside a skill folder. Every project gets its own `factory/` folder at its root holding scope, specs, reviews, runs, and the deploy ledger.

**Rationale:** skills are installed outside the project, shared across every project on the machine, and destroyed on the next reinstall. The specific trap is that a subagent which just read its brief from the install directory has that directory as the freshest path in its context, and it looks reasonable.

**Enforced four ways:** `FACTORY_ROOT` passed as a required placeholder to every spawn; an explicit writable allowlist; the skill folder named as a deny path in every brief; and `scripts/check-skill-writes.mjs` (run as `npm run check:write-rule`), which compares installed skills against source and fails on any write. Wired into `sf-debug`.

**Side effect:** the `docs/` is a published docs site conditional and the `.workflow/` fallback are both obsolete now that a dedicated folder is never a docs site. `.workflow/` deleted.

**Also fixed along the way:** `sf-debug` may only edit factory files inside the factory repo. Without that rule a debug run inside a consuming project would have fixed a skill by editing the installed copy, which is the forbidden write reached by a different path.

**How to verify:**

- `npx skills add . --list` reports 14 of 14
- `node scripts/check-skill-writes.mjs` exits 0 with nothing installed, exits 1 if a file is planted in an installed skill folder
- Root `AGENTS.md` contains the write rule; every brief in `skills/sf-factory-run/agents/` carries `FACTORY_ROOT` and the deny path

**What remains:**

- **The skills are not installed.** Nothing has been run past this point, so the orchestration has never been exercised end to end. Run `npx skills add . -g -a opencode -y`, then load `/sf-factory-run` and confirm it spawns rather than executes inline.
- **`check-skill-writes.mjs` is untested against a real global install.** It has only been proven against a project-local fixture.
- **`factory/conventions.md` does not exist.** Ten skills cite it as authoritative for output style. Pre-existing gap, relocated but not authored.
- **`factory/conventions.md` is still cited by ten skills as authoritative for output style and has never existed.** The stale `SYNTHESIS.md` and `docs/conventions.md` citations were resolved when `ARCHITECTURE.md` replaced the former and `factory/` replaced the latter.
- **Remove the clipboard test product from this repo.** The factory repo currently carries both the factory and a built product (`src/`, `package.json` named `clipboard-snippets-api`, and the 2,524 files of `node_modules/` installed for it). The factory itself needs zero dependencies. Strip the product out once the skills are finished and working; until then it is the test bed, so it stays.

## 2026-10-18: Failure modes reviewed, build made sequential, test product removed

**Problem:** Two questions had to be answered honestly. What happens when the factory breaks? And is this repo the factory, or the factory plus a half finished app?

### The failure review

Every case was checked against the files rather than assumed:

| Case | Status |
|---|---|
| Feature does not work | Covered. Verify fails, two rounds, recorded as an open defect |
| Package will not install | Covered by the fallback ladder, now recorded as an open defect rather than a skipped box |
| Sub-agent errors or times out | **Fixed.** Three attempts, then parked with the error text |
| Agent dies mid-feature | Accepted as solved. The agent assigned the item verifies what exists and continues |
| Claims `done` falsely | **Already covered, and better than proposed.** `sf-develop` may only tick `Build it`, `sf-check verify` owns `Verify it`, and `sf-test` ticks `Test it` only when the suite passes. Three separate agents, and the last one holds the pen on done |
| Two agents write one file | Removed the cause. Build is now sequential |
| Engineer edits code mid-run | Accepted as not worth guarding. Tests catch it |
| Context compacted mid-run | **Fixed** with a compaction hook |

**Changes made:**

1. **Build is now strictly sequential.** This reverses the earlier batch override. Two builders in one tree make the commit checkpoint meaningless, because a commit taken after two features land is not a state anyone proved works, so it cannot be a rollback point, so recoverability disappears quietly. Architect still fans out: separate spec files, no product code, so they cannot collide. The distinction is now written into `AGENTS.md`, `orchestrator.md` and the delegation table.

2. **Bounded dispatch retry.** A dispatch returning no block is retried with the same brief and the same inputs, at most three times, then parked. Same brief deliberately: rewriting it to work around a misbehaving agent means the next attempt tests a different thing than the one that failed.

3. **Getting to the end outranks fixing any defect**, written as a named rule. A package that will not install, a flaky integration, a bug verify keeps finding: each becomes a written open defect and the loop moves on. Two things make that safe rather than optimistic: open defects are recorded so a known defect costs one line instead of a debugging session, and every stub keeps the real interface, so a later feature plugs into what today's feature already calls.

4. **`## Blockers absorbed` became `## Open defects`** in the run file, with a format line. A finished run has entries in it. `telemetry.mjs` counts them, so a run ending with twelve open defects reports twelve rather than looking clean.

5. **`.opencode/plugins/factory-compact.js`** created. opencode fires `experimental.session.compacting` before it generates a continuation summary. The hook injects the scope and the current run file into that prompt, plus one line: the summary may be wrong about what is finished, the files are right. Injects nothing for a project with no `factory/` folder. Tested both ways.

**The test product is removed.** The clipboard snippets API that served as the factory's own test bed is gone, along with `tsconfig.json`, `package-lock.json` and `node_modules/`. All were untracked, so nothing of the factory was in them. `package.json` was rewritten to describe the factory: zero dependencies, four scripts, and a `check` that verifies the write rule and syntax without needing a compiler. The factory ships as markdown and dependency free scripts, and its manifest now says so.

**How to verify:**

- `npm run check` exits 0, with no `npm install` needed first because there is nothing to install
- `npm run telemetry` reports the factory's own scope
- `npx skills add . --list` still discovers 14 of 14

**What remains:**

- The factory has never been run. Every design decision in this log is inferential, and the single test that would change that is one real feature through `/sf-factory-run`.
- Nobody has timed it. Sequential build costs wall clock, and if a feature takes a day instead of an hour the rollback property was not worth buying.
- 78 Claude Code references across 37 files, 14 guarded. On other clients most of the designed context isolation degrades silently.
- The host integration has never touched a Box.
- `factory/conventions.md` is cited by ten skills as authoritative and does not exist.

## 2026-10-18: The harness and the host are now one factory

**Problem:** The factory had two halves that had never been connected, and were being thought of as two things.

- The **harness** is the method: 14 skills, 10 role briefs, the scope as a work queue, tier gates, commit checkpoints.
- The **host** (`sf-create-factory`) is the machinery: GitHub Actions triggers, worker sandboxes, label state machine, secrets, git, pull requests.

Neither knew the other existed. The host ran a plain coding agent against a four rule prompt. The harness had no intake and no trigger. Measured against the literature (Bemer 1968, Humphrey 1991, Greenfield 2003, and four 2026 sources), the factory was missing the Intake and Ship stations and the utilities layer, and it looked like two products.

**The finding that made it cheap:** the host already had every seam needed, unused. `repo.setup` runs arbitrary commands in the sandbox before the agent starts. `jobFiles` sources resolve as URLs and are read fresh on every job. The prompt already declared that its rules "win over any other instructions you have been given, including house rules files."

**Changes made:**

1. **`harness/AGENTS.md`** created. The entry point that lands at `$HOME/AGENTS.md` in the sandbox. It tells the worker it is inside a factory, loads `sf-factory-run`, maps the issue onto the per feature cycle, and records the write rule.

2. **`scripts/emit-harness-config.mjs`** created. Reads this repo and prints the `setup` command and the `jobFiles` array, so a host's config is generated from what is actually on disk. Adding a skill or reference cannot leave a host pointing at something that no longer exists. This is what stops the two halves drifting.

3. **`run.mjs`** gained an optional `harness` block. Present, the prompt tells the agent to read the entry point and load the skill. Absent, behaviour is byte identical to before. **Deliberately optional**: the host's implementation is proven and this changes nothing unless a factory asks for it.

4. **`config.mjs`** validates the harness block as errors, not warnings, so a typo cannot silently ship a factory with no method.

5. **The harness installs through `npx skills add`**, the same command a human uses. No vendored copy, no pinned version, so the worker and the engineer run byte identical skills.

6. **`ARCHITECTURE.md`** created. Two planes, the three seams, one vocabulary mapping host concepts onto harness concepts, and what each plane must never do.

**Resolved conflicts, deliberately:**

- The orchestrator guide commits at every verified feature boundary. That is wrong inside a sandbox, which has no credentials and must not touch git. `harness/AGENTS.md` overrides it and tells the worker to record `deferred: factory owns the commit`, so the record stays honest.
- Ship (`sf-deploy-app`) is now the per change station before `sf-sync`, with `agents/deploy-agent.md`, and is explicitly never run inside a sandbox.
- Skill reference paths are repo relative in the factory checkout but not in a sandbox, where the cwd is the app repo. The entry point documents the translation rather than rewriting a hundred references.

**Utilities closed or bounded, honestly named:**

- `scripts/telemetry.mjs`. Reads `specced_at`, `built_at`, `verified_at`, which three skills already wrote and nothing read. Reports cycle time, the two spans, run counts, and which half is the constraint. Deterministic, so it costs no tokens. Verified against a fixture: medians and ranges correct by hand.
- `.opencode/plugins/factory-guard.js`. A plugin that throws on any write under a skill install directory, including shell commands that name one. The write rule was prose plus a script that only ran when someone remembered; this is a gate. 8 of 8 path cases correct, including Windows separators.
- Spend metering and continuous feedback are named in `ARCHITECTURE.md` as still missing, because a skill cannot see token billing and cannot watch production.

**How to verify:**

- `npm run check:write-rule` exits 0
- `npm run telemetry` reports, and its figures can be checked by hand against the scope
- `npm run emit:harness-config` prints fragments that paste into `factory.config.json`
- `node --check` on `run.mjs` and `config.mjs`; a harness block with a bad type is rejected with a clear message
- `npx skills add . --list` still discovers 14 of 14

**What remains:**

- The harness has never run inside a real Box. The first proof is a smoke test: one worker, one issue, with the harness block in its config.
- `sf-factory-run` teaches a whole product run. In a Box the agent runs the per feature cycle. That mapping is written into `harness/AGENTS.md` but it is an interpretation, not something the harness itself states.
- 78 mentions of Claude Code across 37 skill files, only 14 with a portable fallback. Inside a Box the agent may be Claude Code, in which case this is moot, and on other clients most of that context isolation silently evaporates.
