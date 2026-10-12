# Scope — Software Factory 26

This directory contains the coarse plan for what to build and in what order.

## Usage

- Run `/scope` to create or update this plan
- Run `/scope <feature>` to enroll a specific feature
- Run `/scope` with no argument to reconcile against the current state

## Format

Each feature in the scope has:
- **Status** — `todo`, `in-progress`, `done`, or `blocked`
- **Spec pointer** — Link to the architecture decision (if applicable)
- **Milestones** — Checkpoints as the feature progresses
- **Requirements** — What the feature must do

## Workflow Tier

This project uses the **Beta** tier:
1. `/develop` builds the feature
2. `/check verify` proves it works
3. `/test` writes regression tests
4. Mark `done` when tests pass

Override this for specific features as needed.
