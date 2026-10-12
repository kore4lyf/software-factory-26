# .workflow — Alternative Workflow Files Location

This directory exists when `docs/` is a published documentation site.

## Purpose

If `docs/` is a live documentation site that ships with the product, this directory holds the workflow files instead:
- `scope/` — Feature plans
- `specs/` — Architecture decisions
- `reviews/` — Code review findings

## When to Use

Use this instead of `docs/` when:
- `docs/` is deployed as a public documentation site
- Workflow files would clutter the public docs
- The team prefers keeping workflow separate from product docs

## Migration

If you start using `.workflow/` instead of `docs/`:
1. Move `docs/scope/` to `.workflow/scope/`
2. Move `docs/specs/` to `.workflow/specs/`
3. Move `docs/reviews/` to `.workflow/reviews/`
4. Update all skill references

## See Also

- [workflow-guide.md](https://github.com/jsmastery-pro/skills/blob/main/docs/workflow-guide.md) — JSM's workflow guide
