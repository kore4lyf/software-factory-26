#!/usr/bin/env node
/**
 * check-skill-writes.mjs
 *
 * Enforces the factory write rule: nothing is ever written inside a skill folder.
 *
 * The skills are installed outside the project, shared across every project on the
 * machine, and rewritten on the next reinstall. A write there breaks all of them
 * and vanishes without warning, and because the installed copy lives outside the
 * repo, `git status` cannot see it. This check is the only thing that can.
 *
 * Method: compare each installed factory skill against its source of truth in
 * this repo. Extra files mean something was written there. Missing or modified
 * files mean the installed copy has drifted.
 *
 * Exit 0 clean, exit 1 violations found.
 */

import { readdirSync, statSync, existsSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { homedir } from "node:os"

const REPO = resolve(import.meta.dirname, "..")
const SOURCE = join(REPO, "skills")

const SKILL_ROOTS = [
  join(homedir(), ".agents", "skills"),
  join(homedir(), ".config", "opencode", "skills"),
  join(homedir(), ".claude", "skills"),
  join(REPO, ".agents", "skills"),
  join(REPO, ".opencode", "skills"),
  join(REPO, ".claude", "skills"),
]

/** Every file under dir, as sorted repo relative paths. */
function walk(dir, base = dir) {
  const out = []
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(full, base))
    else out.push(relative(base, full).replaceAll("\\", "/"))
  }
  return out.sort()
}

function installedFactorySkills() {
  const found = new Map()
  for (const root of SKILL_ROOTS) {
    if (!existsSync(root)) continue
    let entries
    try {
      entries = readdirSync(root, { withFileTypes: true })
    } catch {
      continue
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue
      if (!e.name.startsWith("sf-")) continue
      if (!existsSync(join(root, e.name, "SKILL.md"))) continue
      if (!found.has(e.name)) found.set(e.name, [])
      found.get(e.name).push(join(root, e.name))
    }
  }
  return found
}

const violations = []
const notes = []
const installed = installedFactorySkills()

for (const [name, locations] of installed) {
  const sourceDir = join(SOURCE, name)

  if (!existsSync(sourceDir)) {
    notes.push(`${name}: installed but no source in this repo. Not one of ours, skipping.`)
    continue
  }

  const sourceFiles = new Set(walk(sourceDir))

  for (const loc of locations) {
    const tag = relative(homedir(), loc) || loc
    const installedFiles = walk(loc)

    for (const f of installedFiles) {
      if (!sourceFiles.has(f)) {
        violations.push({
          kind: "write",
          skill: name,
          path: join(tag, f),
          detail: "file exists in the installed skill but not in source",
        })
      }
    }

    for (const f of sourceFiles) {
      if (!installedFiles.includes(f)) {
        violations.push({
          kind: "drift",
          skill: name,
          path: join(tag, f),
          detail: "source file is missing from the installed skill",
        })
      }
    }
  }
}

if (violations.length === 0) {
  console.log(`OK  write rule holds. ${installed.size} factory skill(s) installed, no writes into any skill folder.`)
  for (const n of notes) console.log(`note  ${n}`)
  process.exit(0)
}

console.error(`VIOLATION  ${violations.length} problem(s) found in installed skill folders.\n`)
for (const v of violations) {
  console.error(`  [${v.kind}] ${v.skill}`)
  console.error(`     ${v.path}`)
  console.error(`     ${v.detail}`)
}
console.error(`\nA skill folder is shared across every project on this machine and is`)
console.error(`destroyed on the next reinstall. Reinstall to restore, and move the`)
console.error(`artifact to the project's factory/ folder, which is where it belongs.`)
process.exit(1)