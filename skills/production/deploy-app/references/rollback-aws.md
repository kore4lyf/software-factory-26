# Rollback: AWS

**Infrastructure:** AWS (ECS, CloudFormation, EC2)
**Delegated from:** `references/rollback.md`

## Rollback procedure

### For a first deploy (no previous state)

```bash
# 1. Delete the CloudFormation stack (if using ECS/CloudFormation)
aws cloudformation delete-stack --stack-name <stack-name>

# 2. Check stack status
aws cloudformation describe-stacks --stack-name <stack-name>

# 3. Remove ECS task definition (if not using CloudFormation)
aws ecs deregister-task-definition --task-definition <task-name>:<version> 2>/dev/null || true

# 4. Log the rollback
```

### For a redeploy (previous state exists)

```bash
# 1. List recent deployments / task definitions
aws ecs list-task-definitions --family <family-name> --sort DESC

# 2. Rollback: update service to use previous task definition
aws ecs update-service \
  --cluster <cluster-name> \
  --service <service-name> \
  --task-definition <family-name>:<previous-version>

# 3. Verify the rollback
aws ecs describe-services \
  --cluster <cluster-name> \
  --services <service-name>

# 4. Log the rollback
```

## Exercise procedure

Before unattended deploy is enabled, exercise the rollback path:

1. Deploy a known-good build to a test environment
2. Introduce a deliberate failure (e.g., a task that returns 500)
3. Run the gate and watch it fail
4. Verify the rollback triggers automatically
5. Verify the rollback succeeds (service reverts to previous task definition)
6. Log the exercise in `docs/reviews/factory-log.md`

## Verify

- ECS service uses the previous task definition after rollback
- CloudFormation stack is deleted for first deploy rollback
- The rollback is logged in the deploy ledger and `docs/reviews/factory-log.md`
- The exercise has been run and logged
