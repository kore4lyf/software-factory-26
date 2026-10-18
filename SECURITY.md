# Security

This factory has two very different halves, and they carry very different risk. Read this before you run anything.

## The thirteen safe skills

`sf-scope`, `sf-audit`, `sf-architect`, `sf-develop`, `sf-check`, `sf-test`,
`sf-document`, `sf-sync`, `sf-debug`, `sf-start-app`, `sf-review-app`,
`sf-deploy-app`, and `sf-factory-run`.

They are markdown instructions plus a few dependency-free scripts. They read
and write files in your project, and `sf-deploy-app` will talk to your
hosting provider. They hold no credentials of their own and reach no network
service that you did not put in front of them.

Automated scanners rate these **Safe** or **Low Risk**, and that rating is
accurate.

## `sf-create-factory` is different

It is the only skill that builds infrastructure that runs coding agents
unattended. Before you run it, you should know exactly what you are standing
up. Nothing here is a flaw in the skill. It is the shape of the thing.

### What it actually does

- A GitHub Actions workflow starts a job when a labelled issue appears.
- The job claims a worker, which is a disposable cloud sandbox, and runs a
  coding agent inside it with permission prompts disabled.
- The agent reads the issue text as its instructions and writes a pull request.
- Credentials for that agent are placed on the worker's disk for the duration
  of the job and deleted afterwards.

### The risks, and what limits each one

| Risk | Why it exists | What bounds it |
|---|---|---|
| An agent runs with sandbox and approval prompts disabled | Nobody can answer a prompt in a headless worker. Without this it simply does not run | The sandbox is the boundary. It is a disposable cloud VM, non-root, deleted or paused after the job. Escaping it still lands you in a throwaway machine |
| Issue text becomes an agent prompt | The whole design is "an issue describes the work" | A malicious issue body is a real prompt injection path. Mitigated by `allowedActors` gating who can start a run, and by the worker being disposable |
| Credentials sit on the worker disk during a job | The agent has to sign in to run | Written mode 600, deleted in `finally` even when a run fails. Rotate them when the project ends. **Why there is no better way is below**, and it is not for want of trying |
| A compromised dependency could read secrets | `npm ci` runs lifecycle scripts | **Fixed.** Secrets are scoped to the single step that needs them, so no dependency ever runs with a secret in its environment |
| The config could specify an arbitrary shell command | Commands run in the worker | **Fixed.** A command must start with a known agent CLI, or opt in with `allowUnknownCommand: true` |
| A config path could write outside the worker | Paths come from config | **Fixed.** Every path the factory writes inside the Box must stay under `/workspace/home/` |
| A secret could land on the wrong repository | Targets come from config | **Fixed.** `set-secrets.mjs` verifies every destination is reachable and warns when it sits outside your own organisation, before writing anything |
| Actions could be swapped by a moved tag | Tags are mutable | **Fixed.** Actions are pinned to immutable commit SHAs |

### What is left, and cannot be removed

Three things survive every mitigation, because they are what makes the skill
work:

1. **`--dangerously-skip-permissions` and `--dangerously-bypass-approvals-and-sandbox`.** An unattended agent cannot answer a prompt. The Box is the sandbox instead.
2. **Credentials on disk during a job.** The agent must sign in.
3. **Untrusted issue text steering an agent.** Driving automation from issues means the input is whoever opened the issue.

If those three are unacceptable for your environment, do not run this skill.
That is a reasonable decision and there is no mitigation that would make it
otherwise. The remaining thirteen do not need any of them.

### Why credentials are on disk, precisely

This was investigated against `@upstash/box` 0.7.9 rather than assumed. The
SDK offers three ways to hand a credential to a process, and the worker-pool
architecture rules out all three.

**`exec.command` cannot take environment variables.** Its whole signature is
`(command: string)`. There is no options object, so there is nowhere to put
`env`. It is also the only fire-and-forget primitive, and `runScript` depends
on exactly that: it launches detached with `setsid`, polls exit files, and
kills the process group on timeout.

**`exec.session` does take `env`, and cannot be used.** The SDK states that
the session *owns the process*: a dropped connection terminates the command
and sessions cannot be reattached. A 25-minute detached agent run is precisely
the case that forbids.

**`attachHeaders` is the strong answer, and the pool forecloses it.** The Box
SDK can inject a secret header into outbound HTTPS to one host through a
transparent proxy, write-only and never returned by a GET. The credential
would never reach the filesystem, never enter a command string, and the agent
could not read it at all. It is declared on `EphemeralBoxConfig` and there is
no instance method to set it on an existing Box, so it only works for a Box
created per job.

**Switching Codex from a sign-in file to an API key does not help.** Both
kinds of auth are written to the same `~/.factory/env` file before the agent
starts, so an environment-variable secret is on disk exactly like a file one.

The result: with a pre-provisioned, paused worker pool, a file is the only
mechanism left. Moving to an ephemeral Box per job would enable `attachHeaders`
and remove this risk class entirely, at the cost of the pool. Boxes are billed
while running, and pause and resume are what make idle workers free, so that
is a real cost decision rather than a technical one.

## How to run it safely

1. **Dry run first.** Set the repository variable `FACTORY_DRY_RUN` to `true`.
   The job plans, claims nothing and starts no agent. Prove the trigger before
   you let an agent run.
2. **Use a token scoped to one organisation**, with access only to the repos
   you intend it to touch. Not a personal token.
3. **Prefer an API key over a subscription sign-in**, and give it a spending
   limit. Every labelled issue costs money, and a failed check costs a second
   agent run.
4. **Put the factory in its own private repository**, separate from the apps it
   works on.
5. **Rotate the secrets when the project ends.** They are credentials on
   worker disks; treat them accordingly.

## Reporting a problem

Open a GitHub issue on this repository. If a finding involves a credential
that may be live, rotate it first and say so in the issue without including
the value.