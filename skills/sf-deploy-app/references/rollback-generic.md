# Rollback: Generic

**Infrastructure:** Any platform (git-based or container-based)
**Delegated from:** `references/rollback.md`

Use this when no platform-specific implementation exists. The generic rollback relies on git tags or container image tags.

## Rollback procedure

### For a first deploy (no previous state)

```bash
# 1. Remove the deployment
<platform-remove-command>

# 2. Remove resources (only if no user data exists)
# Check: does the database have user records?
# - No user data: remove resources
# - Has user data: STOP, ask the user

# 3. Log the rollback
```

### For a redeploy (previous state exists)

```bash
# 1. List previous deployments (git tags or image tags)
git tag -l | sort -V       # git-based
# or
<platform-list-images>    # container-based

# 2. Revert to the previous tag
git revert <current-commit> --no-edit  # if using git revert
# or
<platform-deploy --image <previous-image-tag>>  # if using container tags

# 3. Verify the rollback
git log --oneline -2       # git-based
# or
<platform-inspect>         # container-based

# 4. Log the rollback
```

## Exercise procedure

Before unattended deploy is enabled, exercise the rollback path:

1. Deploy a known-good build to a test environment
2. Introduce a deliberate failure
3. Run the gate and watch it fail
4. Verify the rollback triggers automatically
5. Verify the rollback succeeds (reverts to previous tag)
6. Log the exercise in `factory/deploy-ledger.md`

## Verify

- The rollback reverts to the previous known-good state
- The rollback is logged in the deploy ledger and `factory/deploy-ledger.md`
- The exercise has been run and logged
