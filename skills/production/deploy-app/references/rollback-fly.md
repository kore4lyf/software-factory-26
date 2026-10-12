# Rollback: Fly.io

**Infrastructure:** Fly.io
**Delegated from:** `references/rollback.md`

## Rollback procedure

### For a first deploy (no previous state)

```bash
# 1. Destroy the app
fly apps destroy <app-name> --yes

# 2. Remove volumes (only if no user data)
fly volume list --app <app-name>
# If no user data: fly volume delete <volume-name> --app <app-name>

# 3. Log the rollback
```

### For a redeploy (previous state exists)

```bash
# 1. List recent releases
fly releases --app <app-name>

# 2. Rollback to the previous release
fly deploy --image-label <previous-image-label> --app <app-name>

# 3. Verify the rollback
fly releases --app <app-name>
# The latest release should be the previous one

# 4. Log the rollback
```

## Exercise procedure

Before unattended deploy is enabled, exercise the rollback path:

1. Deploy a known-good build to a test app
2. Introduce a deliberate failure
3. Run the gate and watch it fail
4. Verify the rollback triggers automatically
5. Verify the rollback succeeds (app reverts to previous release)
6. Log the exercise in `docs/reviews/factory-log.md`

## Verify

- `fly deploy --image-label` reverts to the previous release
- `fly apps destroy` cleans up the app
- The rollback is logged in the deploy ledger and `docs/reviews/factory-log.md`
- The exercise has been run and logged
