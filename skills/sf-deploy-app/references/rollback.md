# Rollback

**Purpose:** When the Step 9 gate fails, rollback runs automatically. No human approval needed once the failure is detected. This is the executable path that makes deploy safe to automate.

> **Hard rule: rollback is a first-class action, not a bullet in a handoff note.** When the gate fails, the deploy skill invokes the rollback path without waiting for human approval. The rollback is exercised before unattended deploy is enabled.

## The pattern (same everywhere)

Every infrastructure shares the same rollback structure:

```
Gate failed?
├── Yes
│   ├── Does previous known-good state exist?
│   │   ├── Yes → Revert to it (procedure below)
│   │   └── No (first deploy) → Remove the deployment and resources
│   └── Log the failure and the rollback action
└── No → Continue to Step 10
```

## Infrastructure implementations

The generic rollback path delegates to an infrastructure-specific implementation:

| Platform | Implementation | Key commands |
|---|---|---|
| Vercel | `references/rollback-vercel.md` | `vercel rollback`, `vercel remove` |
| AWS | `references/rollback-aws.md` | CloudFormation rollback, ECS task definition revert |
| Fly.io | `references/rollback-fly.md` | `fly deploy --image-label`, `fly releases` |
| Generic | `references/rollback-generic.md` | Git revert, container tag rollback |

The deploy skill reads the infrastructure from the scope or `AGENTS.md` and invokes the matching implementation.

## When rollback runs

Rollback is triggered automatically when any of these conditions are true:

1. **Step 9 gate fails.** The deploy is live but the gate proves it does not work.
2. **Build fails after deploy.** The deployment reached a terminal state but the build log shows a failure.
3. **Migration fails.** The schema moved but the app cannot start.

Rollback does NOT run when:
- The gate is blocked (DNS not propagated, missing credentials). Blocked is not failed; the deploy may still be correct.
- The user explicitly asks to skip rollback for a specific reason.

## Generic rollback procedure

### For a first deploy (no previous state)

```bash
# 1. Remove the deployment
<platform-remove-command>

# 2. Remove resources (only if no user data exists)
#    Check: does the database have user records?
#    - No user data → remove it
#    - Has user data → STOP, ask the user

# 3. Remove environment variables
<platform-env-remove-command>

# 4. Log the rollback
```

### For a redeploy (previous state exists)

```bash
# 1. List previous deployments
<platform-list-deployments>

# 2. Revert to the previous known-good state
<platform-rollback-command>

# 3. Verify the rollback
<platform-inspect-command>

# 4. Log the rollback
```

## Logging

Every rollback is logged in the deploy ledger and `factory/deploy-ledger.md`:
- The timestamp
- The reason (which gate check failed)
- The rollback action taken
- The result (success or failure)

## Testing the rollback path

Before unattended deploy is enabled, the rollback path must be exercised at least once. The exercise procedure is in the infrastructure-specific implementation file.

## Verify

- The rollback triggers automatically on gate failure, without human approval
- The rollback reverts to the previous known-good state (or removes it for a first deploy)
- The rollback is logged in the deploy ledger and `factory/deploy-ledger.md`
- The rollback path has been exercised at least once before unattended deploy is enabled
