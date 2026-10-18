// factory-compact.js
//
// After a compaction the orchestrator has a summary of the conversation, not the
// run. On a long run, one hour a day across many sessions, that summary is the
// difference between knowing where the run is and starting over.
//
// This injects the two files that hold the run's actual state into the
// continuation prompt, so a compacted session resumes from disk rather than
// from a lossy recollection of a chat.
//
// It reads, it writes nothing, and it has no dependencies.

import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"

const FACTORY = "factory"

/** The most recent run file, which is the one a resumed session cares about. */
function currentRun(root) {
  const dir = join(root, FACTORY, "runs")
  if (!existsSync(dir)) return null
  const files = readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md").sort()
  return files.length ? join(dir, files[files.length - 1]) : null
}

export const FactoryCompaction = async ({ directory }) => {
  const root = directory ?? process.cwd()

  return {
    "experimental.session.compacting": async (_input, output) => {
      const run = currentRun(root)
      const scope = join(root, FACTORY, "scope", "scope.md")

      const lines = ["## Software Factory run state", "", "This session is a factory run and is about to be compacted. Before continuing, re-read these from disk rather than from memory:", ""]

      if (existsSync(scope)) lines.push(`- \`${scope}\` — the work queue. The first unticked box on each feature row is the instruction.`)
      if (run) lines.push(`- \`${run}\` — the run record: mode, loop log, checkpoints, assumptions, open defects.`)
      if (!existsSync(scope) && !run) {
        // No factory folder, so there is nothing to restore. Say so rather than
        // injecting an empty heading that costs context for no reason.
        return
      }

      lines.push("")
      lines.push("After compaction the summary above may be wrong about what is finished. The files are right. Trust them over the summary, and trust the scope over both.")

      output.context.push(lines.join("\n"))
    },
  }
}