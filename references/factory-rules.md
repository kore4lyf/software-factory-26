# Factory Rules

**Purpose:** Track the lessons the factory has learned from debugging. Each entry is a rule update that landed in a factory file (scope template, architect checklist, reference, or develop gate) because a bug traced back to a bad decision. This is the factory's memory. It gets smarter with every bug it fixes.

**How it works:** When /debug fixes a bug whose root cause traces to a bad decision (not just a coding mistake), the debug skill either:
1. Updates a factory file with a new rule, checklist item, or reference guard, OR
2. Emits an explicit `wont-fix-factory: <reason>` if the decision was reasonable at the time.

Every update is logged here with the bug that triggered it, the root cause, the file updated, and what changed.

---

## Rule Updates

| Date | Bug | Root cause | File updated | What changed |
|---|---|---|---|---|
| — | — | — | — | — |

---

## Wont-fix Decisions

| Date | Bug | Root cause | Why it was reasonable at the time |
|---|---|---|---|
| — | — | — | — |

---

## How to add an entry

When /debug finishes a fix and the root cause traces to a bad decision:

1. Determine the category (scope template gap, architect checklist gap, reference gap, develop gate gap, or not a factory gap).
2. Make the surgical edit to the factory file it belongs to.
3. Add a row to the Rule Updates table above with the date, bug, root cause, file updated, and what changed.
4. Log the update in `FACTORY-LOG.md`.

If the decision was reasonable at the time, add a row to the Wont-fix Decisions table instead. No file update needed.

This file is owned by /debug. No other skill writes to it.
