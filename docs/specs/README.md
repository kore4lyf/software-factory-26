# Specs — Software Factory 26

This directory contains architecture decisions, one per file.

## Naming

Files use the format `NNNN-title.md` where:
- `NNNN` is a sequential number (0001, 0002, etc.)
- `title` is a slug of the decision

## Spec Status Lifecycle

| Status | Meaning |
|--------|---------|
| `Proposed` | Decided but not built yet |
| `In Progress` | Build has started |
| `Accepted` | Feature shipped and verified |
| `Assumed` | Built before decision was made (owes ratification) |
| `Superseded` | Replaced by a newer decision |

## Usage

- Run `/architect` to create a new spec
- Run `/architect <feature>` to deliberate a specific decision
- Run `/sync` to flag specs that have become stale

## Ownership

Only `/architect` writes spec content. `/develop` only touches the status line. `/sync` flags stale specs. No other skill edits a spec.
