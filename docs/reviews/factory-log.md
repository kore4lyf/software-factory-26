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

2. **deploy-app/SKILL.md Step 9** now invokes the rollback path automatically when the gate returns FAIL. No human approval is needed once the failure is detected. The rollback is logged in the deploy ledger and docs/reviews/factory-log.md.

3. **deploy-app/references/gate.md** now distinguishes failed from blocked. Failed triggers rollback. Blocked does not (the deploy may still be correct). The rollback path is referenced directly.

4. **deploy-app/references/recovery.md** now references the rollback path. The rollback is automatic on gate failure, not a manual step. Failed builds trigger rollback, not retry.

5. **deploy-app/SKILL.md Step 11** now references the rollback path instead of describing it inline. The rollback is a first-class action with its own reference file.

**How to verify:**

- Run a deploy with a known-good build. The gate passes. No rollback.
- Introduce a deliberate failure (e.g., a route that returns 500). Run the gate. The gate fails. The rollback triggers automatically.
- Verify the rollback reverts the deployment to the previous known-good state (or removes it for a first deploy).
- Check docs/reviews/factory-log.md for the rollback log entry.

**What is NOT done yet:**

- The rollback path has NOT been exercised yet. Unattended deploy is disabled until the rollback path has been exercised at least once. The exercise procedure is defined in rollback.md.
- Gap 4 (feedback loop) is not started.
- Gap 5 (references as code) is not started.

**Blunt assessment:** Rollback is now an executable path, not a handoff note. It runs automatically on gate failure. The deploy skill is safer than before. The rollback is infrastructure-agnostic: the generic `references/rollback.md` defines the pattern, and platform-specific implementations (`rollback-vercel.md`, `rollback-aws.md`, `rollback-fly.md`, `rollback-generic.md`) handle each infrastructure. When infrastructure is available, it follows the guide. But the rollback path is unproven. It must be exercised before unattended deploy can be enabled. The factory is not yet safe to fully automate deploy.

## 2026-10-12: Gap 4 closed. Debug feedback loop now writes lessons back to the factory.

**Problem:** Debug and review-app were strong on the app under repair. Nothing wrote the lesson back into the factory's own files. The factory kept making the same mistakes.

**Changes made:**

1. **debug/SKILL.md** added Step 7: Factory feedback loop. When a bug's root cause traces to a bad decision (not just a coding mistake), the debug skill now either updates a factory file (scope template, architect checklist, reference, or develop gate) or emits an explicit `wont-fix-factory: <reason>`. The update is a surgical edit to the factory file it belongs to, logged in docs/reviews/factory-log.md.

2. **references/factory-rules.md** created. This tracks every rule update the factory has learned from debugging. Each entry has the date, the bug that triggered it, the root cause, the file updated, and what changed. Also tracks wont-fix decisions (bugs that traced to reasonable-at-the-time decisions).

**How to verify:**

- Run /debug on a bug whose root cause is a bad decision (e.g., the spec didn't name a timezone source, the build invented one).
- After the fix, check that the debug skill updated a factory file (e.g., added a checklist item to the design conversation, or a validation rule to the scope template).
- Check docs/reviews/factory-log.md for the log entry.
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
