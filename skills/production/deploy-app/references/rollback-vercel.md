# Rollback: Vercel

**Infrastructure:** Vercel (vercel.com)
**Delegated from:** `references/rollback.md`

## Rollback procedure

### For a first deploy (no previous deployment)

```bash
# 1. Remove the project deployment
npx --yes vercel@latest remove <project-name> --yes

# 2. Remove the database (only if no user data exists)
npx --yes vercel@latest db stop <database-name> 2>/dev/null || true
# Check: does the database have user records?
# - If no user records: npx --yes vercel@latest db rm <database-name> --yes
# - If has user data: STOP, ask the user

# 3. Remove environment variables
npx --yes vercel@latest env rm <variable-name> production 2>/dev/null || true

# 4. Log the rollback
```

### For a redeploy (previous deployment exists)

```bash
# 1. List recent deployments
npx --yes vercel@latest inspect <production-url> --wait

# 2. Rollback to the previous deployment
npx --yes vercel@latest rollback <production-url>

# 3. Verify the rollback
npx --yes vercel@latest inspect <production-url> --wait
# The deployment should show the previous commit hash

# 4. Log the rollback
```

## Exercise procedure

Before unattended deploy is enabled, exercise the rollback path:

1. Deploy a known-good build to a test project
2. Introduce a deliberate failure (e.g., a route that returns 500)
3. Run the gate and watch it fail
4. Verify the rollback triggers automatically
5. Verify the rollback succeeds (site reverts to known-good state)
6. Log the exercise in `docs/reviews/factory-log.md`

## Verify

- `vercel rollback` reverts to the previous deployment
- `vercel remove` cleans up the project
- The rollback is logged in the deploy ledger and `docs/reviews/factory-log.md`
- The exercise has been run and logged
