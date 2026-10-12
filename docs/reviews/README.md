# Reviews

This directory contains code review findings from `/check review`.

## Format

Each review is a dated file:
- `YYYY-MM-DD-feature-name.md` — Feature review
- `YYYY-MM-DD-pr-number.md` — PR review

## What Goes Here

- Findings from `/check review` (fresh model reads the diff)
- Ranked by severity
- Read-only, never edited

## What Doesn't Go Here

- `/check verify` output (that proves runtime behavior)
- `/review-app` output (that goes to a separate review report)

## See Also

- [check skill](../skills/build/check/SKILL.md) — How reviews work
