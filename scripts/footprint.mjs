#!/usr/bin/env node
/**
 * footprint.mjs
 *
 * Checks what a factory sub-agent actually touched, so a brief that ran past its
 * task is caught at that step instead of at the end of the run.
 *
 * A sub-agent's returning block is a claim, not evidence. A station that did its
 * job well and one that silently did three other jobs look identical from the
 * outside. The filesystem does not, so this reads the filesystem.
 *
 * The check is two sided, because either side alone misses the interesting case:
 *
 *   1. Did the artifact the station promised actually appear?   (--expect)
 *   2. Did anything change outside the footprint it was given? (--allow)
 *
 * The scope breach that started this is the second side: the scope agent wrote
 * scope.md correctly *and* wrote index.html, style.css, app.js and a spec. The
 * first side alone would have passed it.
 *
 * Usage:
 *   node scripts/footprint.mjs capture --repo <dir> --baseline <file> [--label <name>]
 *   node scripts/footprint.mjs verify  --repo <dir> --baseline <file>
 *                                       [--expect <glob>]... [--allow <glob>]...
 *                                       [--label <name>]
 *
 * Exit 0 clean, exit 1 footprint breach, exit 2 bad usage.
 */

import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"

const EXCLUDED_DIRS = new Set([
  "node_modules", ".git", ".next", ".svelte-kit", ".turbo", ".cache",
  "dist", "build", "out", "coverage", "vendor", "__pycache__",
])

function parseArgs(argv) {
  const opts = { allow: [], expect: [], repo: ".", label: "", baseline: "" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith("--")) continue
    const key = a.slice(2)
    if (key === "allow" || key === "expect") {
      opts[key].push(argv[++i])
    } else {
      opts[key] = argv[++i]
    }
  }
  return opts
}

function isGitRepo(repo) {
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd: repo, stdio: ["ignore", "pipe", "ignore"],
    })
    return true
  } catch {
    return false
  }
}

/** Paths git considers modified, staged or untracked, as repo relative POSIX paths. */
function gitDirtyPaths(repo) {
  let raw
  try {
    raw = execFileSync(
      "git",
      ["-c", "core.quotepath=false", "status", "--porcelain", "-uall"],
      { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    )
  } catch {
    return null
  }
  const out = []
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue
    const rest = line.slice(3).trim()
    // Renames read "old -> new". The new path is what exists now.
    const path = rest.includes(" -> ") ? rest.split(" -> ").pop() : rest
    out.push(path.replaceAll("\\", "/"))
  }
  return out
}

/** Every tracked or untracked file, for repos with no git. */
function walkPaths(repo) {
  const out = []
  const walk = (dir) => {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (e.name.startsWith(".git")) continue
      const full = join(dir, e.name)
      if (e.isDirectory()) {
        if (EXCLUDED_DIRS.has(e.name)) continue
        walk(full)
      } else {
        out.push(relative(repo, full).replaceAll("\\", "/"))
      }
    }
  }
  walk(repo)
  return out
}

function hashFile(full) {
  try {
    return createHash("sha256").update(readFileSync(full)).digest("hex")
  } catch {
    return null
  }
}

function snapshot(repo, skip = new Set()) {
  const paths = (gitDirtyPaths(repo) ?? walkPaths(repo)).filter((p) => !skip.has(p))
  const map = new Map()
  for (const p of paths) {
    const h = hashFile(join(repo, p))
    if (h) map.set(p, h)
  }
  return map
}

function globToRegExp(glob) {
  let re = ""
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]
    if (c === "*") {
      if (glob[i + 1] === "*") {
        if (glob[i + 2] === "/") { re += "(?:.*/)?"; i += 2 }
        else { re += ".*"; i += 1 }
      } else re += "[^/]*"
    } else if (c === "?") re += "[^/]"
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&")
  }
  return new RegExp("^" + re + "$")
}

const matchesAny = (path, globs) => globs.some((g) => globToRegExp(g).test(path))

// A skill folder is shared across every project and destroyed on the next
// reinstall, so a write there is a breach no matter what --allow says.
function isSkillPath(path) {
  return (
    /^(\.agents|\.opencode|\.claude)\/skills\//.test(path) ||
    /^skills\/sf-/.test(path)
  )
}

function main() {
  const [mode, ...rest] = process.argv.slice(2)
  const opts = parseArgs(rest)

  if (mode !== "capture" && mode !== "verify") {
    console.error("usage: footprint.mjs <capture|verify> --repo <dir> --baseline <file> [--expect <glob>] [--allow <glob>] [--label <name>]")
    process.exit(2)
  }
  if (!opts.baseline) {
    console.error("error: --baseline <file> is required")
    process.exit(2)
  }

  const repo = resolve(opts.repo)
  if (!existsSync(repo)) {
    console.error(`error: repo not found: ${repo}`)
    process.exit(2)
  }

  const baselinePath = resolve(opts.baseline)
  const skip = new Set([relative(repo, baselinePath).replaceAll("\\", "/")])

  if (mode === "capture") {
    const snap = snapshot(repo, skip)
    mkdirSync(dirname(baselinePath), { recursive: true })
    writeFileSync(
      baselinePath,
      JSON.stringify({ label: opts.label || "", repo, files: Object.fromEntries(snap) }, null, 2),
      "utf8",
    )
    console.log(`OK  baseline captured for "${opts.label || "run"}". ${snap.size} file(s) already dirty.`)
    process.exit(0)
  }

  if (!existsSync(baselinePath)) {
    console.error(`error: no baseline at ${baselinePath}. Run "capture" before spawning the station.`)
    process.exit(2)
  }

  const before = JSON.parse(readFileSync(baselinePath, "utf8")).files ?? {}
  const after = snapshot(repo, skip)
  const label = opts.label || JSON.parse(readFileSync(baselinePath, "utf8")).label || "station"

  const added = []
  const modified = []
  const removed = []

  for (const [p, h] of after) {
    if (!(p in before)) added.push(p)
    else if (before[p] !== h) modified.push(p)
  }
  for (const p of Object.keys(before)) {
    if (!after.has(p)) removed.push(p)
  }

  const touched = [...added, ...modified, ...removed].sort()

  // Side 2: anything outside the footprint.
  const breaches = touched.filter((p) => !matchesAny(p, opts.allow))

  // Side 1: the artifact the station promised.
  const unmet = opts.expect.filter(
    (g) => !added.some((p) => globToRegExp(g).test(p)) && !modified.some((p) => globToRegExp(g).test(p)),
  )

  // Always fatal, regardless of --allow.
  const skillWrites = touched.filter(isSkillPath)

  const problems = []
  if (unmet.length) problems.push({ kind: "missing", detail: unmet })
  if (breaches.length) problems.push({ kind: "outside-footprint", detail: breaches })
  if (skillWrites.length) problems.push({ kind: "skill-write", detail: skillWrites })

  if (problems.length === 0) {
    const what = touched.length ? `${touched.length} change(s), all inside its footprint` : "no file changes at all"
    console.log(`OK  "${label}" stayed in its footprint. ${what}.`)
    process.exit(0)
  }

  console.error(`BREACH  "${label}" did not stay inside its task.\n`)
  for (const p of problems) {
    const heading = {
      missing: "promised artifact was never written",
      "outside-footprint": "wrote outside the footprint it was given",
      "skill-write": "wrote into a skill folder",
    }[p.kind]
    console.error(`  [${p.kind}] ${heading}:`)
    for (const item of p.detail) console.error(`     ${item}`)
    console.error("")
  }
  console.error(`A station that ran past its task looks exactly like one that did its`)
  console.error(`job well, so the returning block is not evidence. Do not accept this`)
  console.error(`result. Re-spawn the station with a narrower brief, and record the`)
  console.error(`breach in the run file before continuing.`)
  process.exit(1)
}

main()