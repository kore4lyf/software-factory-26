# Deploy Ledger

Append only. Every deploy and every rollback lands here, written by `sf-deploy-app`.

One entry per event. Newest at the bottom. Do not rewrite history, append to it.

## Entry format

```
## <ISO timestamp> · <project> · <environment>

**Action**: deploy | rollback
**Trigger**: <what initiated it: engineer request, gate failure, recovery>
**Target**: <url or resource>
**Result**: <what the outcome was>
**Gate**: pass | fail | blocked
**Rollback**: not needed | <what was reverted, or what was removed>
```

## Notes

A `rollback` entry is written whether the rollback succeeded or failed. A failed rollback is the entry you will need most, so record it accurately rather than omitting it.

**Unattended deploy is disabled until the rollback path has been exercised at least once.** Until an entry below proves the rollback ran end to end, a rollback is a procedure nobody has watched work. See `FACTORY-LOG.md` in the factory source repo for why that path exists.