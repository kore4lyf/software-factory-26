# factory/

Everything the Software Factory writes about this project lives here.

| Folder or file | Written by | Holds |
|---|---|---|
| `scope/` | `sf-scope` | Feature plans, in order, with decision seeds |
| `specs/` | `sf-architect` | Build specs, the contracts a build follows |
| `reviews/` | `sf-check` | Verify and review findings |
| `runs/` | `sf-factory-run` | One file per run: state, checkpoints, follow ups. Created on the first run |
| `deploy-ledger.md` | `sf-deploy-app` | Deploy and rollback events |
| `releases/`, `postmortems/` | `sf-document` | Release notes and incident write ups |

It is a dedicated folder, never a published docs site, so there is no artifact base detection and no alternative location.

**Format and rules live with the skills, not in this folder.** Each skill owns its own artifacts and documents their shape in its `SKILL.md` and templates. A README here would not be read by the agents that write these files, so it would only drift.

The factory's own engineering history is not here. It belongs to the factory source repo as `FACTORY-LOG.md`, and is never copied into a consuming project.