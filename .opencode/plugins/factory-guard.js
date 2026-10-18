// factory-guard.js
//
// Enforces the factory write rule at the only layer that cannot be forgotten.
//
// The rule is prose in AGENTS.md and in every sub-agent brief, and
// scripts/check-skill-writes.mjs verifies it afterwards. Prose is a request.
// This is a gate: the tool call never happens.
//
// A skill folder is shared across every project on the machine and is destroyed
// on the next reinstall. A write there breaks all of them. The trap is that a
// sub-agent which just read its brief from ~/.agents/skills/sf-develop/ has that
// folder as the freshest path in its context, so it looks like a reasonable
// place to leave a note. It is not.
//
// Copy this file into a consuming project's .opencode/plugins/ to get the same
// guard there. It has no dependencies.

import { homedir } from "node:os"
import { join, resolve, normalize } from "node:path"

const HOME = homedir()

// Every location an Agent Skills client installs skills to. A write under any of
// them is a write to the shared install, not to this project.
const SKILL_ROOTS = [
  join(HOME, ".agents", "skills"),
  join(HOME, ".config", "opencode", "skills"),
  join(HOME, ".claude", "skills"),
  resolve(process.cwd(), ".agents", "skills"),
  resolve(process.cwd(), ".opencode", "skills"),
  resolve(process.cwd(), ".claude", "skills"),
].map((p) => normalize(p).replace(/[\\/]+$/, "").toLowerCase())

/** True when the path sits inside a skill install directory. */
function isSkillPath(p) {
  if (!p || typeof p !== "string") return false
  const norm = normalize(p).replace(/[\\/]+$/, "").toLowerCase()
  return SKILL_ROOTS.some((root) => norm === root || norm.startsWith(root + "/") || norm.startsWith(root + "\\"))
}

const MESSAGE = [
  "Blocked: the factory write rule.",
  "",
  "That path is inside an installed skill folder. Skills are installed outside",
  "the project, shared across every project on this machine, and rewritten on the",
  "next reinstall. A write there breaks all of them and then disappears without",
  "warning.",
  "",
  "You just read your brief from that folder, so it looks like a reasonable place",
  "to leave something. It is not.",
  "",
  "Write to the project's factory/ folder instead, which is where factory artifacts",
  "belong. If this really is a skill bug, it belongs in the factory source repo, and",
  "it reaches every project on the next reinstall rather than corrupting one now.",
].join("\n")

/** Tools that name a destination file directly. */
function destinationOf(args) {
  if (!args || typeof args !== "object") return null
  return args.filePath ?? args.path ?? args.file ?? args.filename ?? null
}

export const FactoryGuard = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      const tool = String(input?.tool ?? "").toLowerCase()
      const args = output?.args ?? {}

      // write, edit, patch, and friends all name a file.
      if (["write", "edit", "patch", "multiedit", "apply_patch"].includes(tool)) {
        const dest = destinationOf(args)
        if (isSkillPath(dest)) throw new Error(`${MESSAGE}\n\nBlocked path: ${dest}`)
        return
      }

      // A shell command can write anywhere, so check the paths it mentions.
      if (tool === "bash") {
        const command = String(args.command ?? args.cmd ?? "")
        if (!command) return
        for (const root of SKILL_ROOTS) {
          // Match the path in any quoting, with either separator.
          const pattern = new RegExp(root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\\/g, "[\\\\/]"), "i")
          if (pattern.test(command)) {
            throw new Error(`${MESSAGE}\n\nBlocked command mentions: ${root}`)
          }
        }
      }
    },
  }
}