#!/usr/bin/env node
/**
 * telemetry.mjs
 *
 * Reads a project's factory/ artifacts and reports how the factory is actually
 * performing. Deterministic, so it costs no tokens to run and always gives the
 * same answer.
 *
 * Every column it reads is already being written by a skill:
 *   specced_at  by sf-architect, at spec capture
 *   built_at    by sf-develop, at build complete
 *   verified_at by sf-check verify, at verification pass
 *
 * Nobody read them. That is what this does.
 *
 * Usage:
 *   node scripts/telemetry.mjs [project-root]
 *   node scripts/telemetry.mjs --json
 */

import { readdirSync, existsSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"

const args = process.argv.slice(2)
const asJson = args.includes("--json")
const root = resolve(args.find((a) => !a.startsWith("--")) ?? process.cwd())
const FACTORY = join(root, "factory")

const DAY = 86400000

function readIf(p) {
  try {
    return readFileSync(p, "utf8")
  } catch {
    return null
  }
}

/** Parses YYYY-MM-DD, returns ms or null. Returns null for the placeholders. */
function parseDate(s) {
  if (!s) return null
  const t = s.trim().replace(/^`|`$/g, "")
  // The scope writes an em dash, an en dash or a hyphen when a date is unset.
  // All three are placeholders, not dates, and new Date() does not reject them.
  if (!t || /^[\s\-\u2013\u2014.?]+$/.test(t)) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null
  const d = new Date(t)
  return Number.isNaN(d.getTime()) ? null : d.getTime()
}

/** A difference in days, or null when either end is missing. */
function span(from, to) {
  if (from === null || to === null) return null
  return days(to - from)
}

/** Drops fenced code blocks, so a template's example is never counted as data. */
function stripFences(md) {
  return md.replace(/```[\s\S]*?```/g, "")
}

/** The At a glance table rows: feature name, status, and the three dates. */
function parseScope() {
  const md = readIf(join(FACTORY, "scope", "scope.md"))
  if (!md) return null

  const rows = []
  let header = null
  for (const line of md.split(/\r?\n/)) {
    const t = line.trim()
    if (!t.startsWith("|")) continue
    const cells = t.slice(1, t.endsWith("|") ? -1 : undefined).split("|").map((c) => c.trim())
    if (cells.every((c) => /^:?-{2,}:?$/.test(c) || c === "")) continue
    const lower = cells.map((c) => c.toLowerCase())
    if (!header && lower.some((c) => c.includes("feature")) && lower.some((c) => c.includes("status"))) {
      header = cells
      continue
    }
    if (!header) continue
    const idx = (name) => header.findIndex((h) => h.toLowerCase().includes(name))
    const name = cells[idx("feature")] ?? cells[1]
    const status = (cells[idx("status")] ?? "").replace(/`/g, "").trim()
    if (!name || name.toLowerCase() === "feature" || /^-+$/.test(name)) continue
    rows.push({
      name,
      status,
      specced: parseDate(cells[idx("specced")]),
      built: parseDate(cells[idx("built")]),
      verified: parseDate(cells[idx("verified")]),
    })
  }
  return { rows, header }
}

function median(xs) {
  if (xs.length === 0) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function days(ms) {
  return ms === null ? null : Math.round((ms / DAY) * 10) / 10
}

function fmt(v, unit = "d") {
  return v === null || v === undefined ? "-" : `${v}${unit}`
}

/** Assumptions, open defects and follow ups, summed across every run file. */
function parseRuns() {
  const dir = join(FACTORY, "runs")
  if (!existsSync(dir)) return null
  const files = readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md")
  let assumptions = 0,
    openDefects = 0,
    followUps = 0,
    checkpoints = 0
  for (const f of files) {
    const md = readIf(join(dir, f)) ?? ""
    const section = (name) => {
      const i = md.indexOf(`## ${name}`)
      if (i < 0) return ""
      const rest = md.slice(i + name.length + 3)
      const j = rest.indexOf("\n## ")
      return j < 0 ? rest : rest.slice(0, j)
    }
    const countLines = (s) => (s.match(/^- |^\d+\. /gm) ?? []).length
    assumptions += countLines(section("Assumptions"))
    openDefects += countLines(section("Open defects"))
    followUps += countLines(section("Follow ups"))
    checkpoints += (section("Checkpoints").match(/^[0-9a-f]{7,}/gm) ?? []).length
  }
  return { runs: files.length, assumptions, openDefects, followUps, checkpoints }
}

/** Rollback events, from the deploy ledger. */
function parseLedger() {
  const md = readIf(join(FACTORY, "deploy-ledger.md"))
  if (!md) return null
  const body = stripFences(md)
  const deploys = (body.match(/\*\*Action\*\*:\s*deploy/gi) ?? []).length
  const rollbacks = (body.match(/\*\*Action\*\*:\s*rollback/gi) ?? []).length
  return { deploys, rollbacks }
}

const scope = parseScope()
if (!scope) {
  console.error(`No factory/scope/scope.md under ${root}. Nothing to measure yet.`)
  process.exit(1)
}

const { rows } = scope
const shipped = rows.filter((r) => r.status === "done")
const verified = rows.filter((r) => r.verified !== null)
const cycle = verified.map((r) => span(r.specced, r.verified)).filter((v) => v !== null)
const specToBuild = rows.map((r) => span(r.specced, r.built)).filter((v) => v !== null && v >= 0)
const buildToVerify = rows.map((r) => span(r.built, r.verified)).filter((v) => v !== null && v >= 0)

const byStatus = {}
for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1

const report = {
  project: root,
  features: { total: rows.length, byStatus },
  cycle_time_days: {
    n: cycle.length,
    median: median(cycle),
    slowest: cycle.length ? Math.max(...cycle) : null,
    fastest: cycle.length ? Math.min(...cycle) : null,
  },
  spec_to_build_days: { n: specToBuild.length, median: median(specToBuild) },
  build_to_verify_days: { n: buildToVerify.length, median: median(buildToVerify) },
  runs: parseRuns(),
  deploys: parseLedger(),
  bottlenecks: (() => {
    const a = median(specToBuild),
      b = median(buildToVerify)
    if (a === null && b === null) return "not enough timestamps yet"
    if (a !== null && b !== null)
      return a > b ? "spec to build is slower than build to verify: architecting is the constraint" : "build to verify is slower than spec to build: verification is the constraint"
    return a !== null ? "architecting is the measured constraint" : "verification is the measured constraint"
  })(),
}

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const pad = (s, n) => String(s).padEnd(n)
  console.log(`\nFactory telemetry  ${root}\n`)
  console.log(`  features        ${report.features.total}   ${Object.entries(byStatus).map(([k, v]) => `${k} ${v}`).join(", ")}`)
  console.log(`  shipped         ${shipped.length} of ${rows.length}   verified ${verified.length}`)
  console.log(`\n  cycle time      median ${fmt(report.cycle_time_days.median)}   over ${cycle.length} verified feature(s)`)
  console.log(`                  range  ${fmt(report.cycle_time_days.fastest)} to ${fmt(report.cycle_time_days.slowest)}`)
  console.log(`  spec -> build   median ${fmt(report.spec_to_build_days.median)}`)
  console.log(`  build -> verify median ${fmt(report.build_to_verify_days.median)}`)
  if (report.runs)
    console.log(`\n  runs            ${report.runs.runs}   checkpoints ${report.runs.checkpoints}   assumptions ${report.runs.assumptions}   open defects ${report.runs.openDefects}   follow ups ${report.runs.followUps}`)
  if (report.deploys)
    console.log(`  deploys         ${report.deploys.deploys}   rollbacks ${report.deploys.rollbacks}`)
  console.log(`\n  constraint      ${report.bottlenecks}\n`)
  if (verified.length === 0)
    console.log("  No verified feature yet, so the timings above are empty. They fill in\n  as sf-check verify writes verified_at.\n")
}