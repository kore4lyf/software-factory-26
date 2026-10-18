#!/usr/bin/env node
/**
 * emit-harness-config.mjs
 *
 * Reads this repo and prints the factory.config.json fragments that make a
 * host repo run THIS harness: the setup command that installs the skills, and
 * the jobFiles that carry the harness instructions and references into the Box.
 *
 * Nothing here is hand-maintained. The host's config is generated from what is
 * actually on disk, so adding a skill or a reference file cannot leave the host
 * pointing at something that no longer exists.
 *
 * Usage:
 *   node scripts/emit-harness-config.mjs                 # human readable
 *   node scripts/emit-harness-config.mjs --json          # paste-ready fragments
 *   node scripts/emit-harness-config.mjs --source URL    # install from a URL, not local
 */

import { readdirSync, existsSync, readFileSync } from "node:fs"
import { join, relative, resolve, basename } from "node:path"

const REPO = resolve(import.meta.dirname, "..")
const args = process.argv.slice(2)
const asJson = args.includes("--json")

// Where the harness will be read from once the host repo is pushed. Point this
// at the branch or tag you actually want the workers to run.
const sourceIdx = args.indexOf("--source")
const SOURCE = sourceIdx >= 0 ? args[sourceIdx + 1] : `https://github.com/OWNER/${basename(REPO)}`

// Which agents to install for. These three are the agent types the host's
// factory.config.json declares, and between them they cover the Box: the
// universal install lands in ~/.agents/skills, which OpenCode and Codex both
// read, and Claude Code gets a symlink.
//
// The ids are not guessable: it is 'claude-code', not 'claude'. Do not use
// '-a *' with -g, because some agents (PromptScript) reject global installs and
// the command fails on them even though the rest succeeded.
const agentIdx = args.indexOf("--agent")
const AGENTS = (agentIdx >= 0 ? args[agentIdx + 1] : "opencode,claude-code,codex").split(",").map((s) => s.trim()).filter(Boolean)
const AGENT_FLAGS = AGENTS.map((a) => `-a ${a}`).join(" ")

const BOX_HOME = "/workspace/home"
const SKILLS_DEST = `${BOX_HOME}/.agents/skills`

function listSkills() {
  const dir = join(REPO, "skills")
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, "SKILL.md")))
    .map((e) => e.name)
    .sort()
}

function listReferences() {
  const dir = join(REPO, "references")
  if (!existsSync(dir)) return []
  const out = []
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.name.endsWith(".md")) out.push(relative(REPO, full).replaceAll("\\", "/"))
    }
  }
  walk(dir)
  return out.sort()
}

const skills = listSkills()
const references = listReferences()

const setup = [
  // The skills install through the same CLI a human uses, so the Box runs the
  // exact same skill set the humans do. '--skill *' takes every skill in the repo,
  // and '-g' puts them in the Box user's home, which is where every Agent Skills
  // client looks.
  `npx --yes skills@latest add ${SOURCE} --skill '*' -g ${AGENT_FLAGS} -y`,
]

const jobFiles = [
  // The harness entry point. It wins over the app repo's own rules file, which
  // the factory's prompt already guarantees.
  { from: "harness/AGENTS.md", to: `${BOX_HOME}/AGENTS.md` },
  // Reference files the skills read. They land beside the skills rather than in
  // the app repo, because the app repo is not the factory and does not own them.
  ...references.map((r) => ({ from: r, to: `${BOX_HOME}/.agents/${r}` })),
]

if (asJson) {
  console.log(JSON.stringify({ setup, jobFiles }, null, 2))
} else {
  console.log(`Source:   ${SOURCE}`)
  console.log(`Agents:   ${AGENTS.join(", ")}   (override with --agent id1,id2)`)
  console.log(`Skills:   ${skills.length}  (${skills.join(", ")})\n`)
  console.log("Add to each entry in `repos` in factory.config.json:\n")
  console.log(JSON.stringify({ setup, jobFiles }, null, 2))
  console.log("\nThen tell the agent type to run the harness, by adding to its `promptExtra`:")
  console.log(`  "promptExtra": "Load the skill sf-factory-run and follow it, then read ${BOX_HOME}/AGENTS.md before doing anything else."`)
  console.log("\nAnd add the optional top level block:")
  console.log(`  "harness": { "command": "sf-factory-run", "entry": "${BOX_HOME}/AGENTS.md" }`)
}

if (skills.length === 0) {
  console.error("\nWARNING: no skills found under skills/. The factory would run with no harness.")
  process.exitCode = 1
}