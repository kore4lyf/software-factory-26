#!/usr/bin/env node
/**
 * run.mjs
 *
 * One command guard for every station. Harness-agnostic: it is a plain script
 * any agent's shell can run, so it works in opencode, Claude Code, Codex, or
 * anything else, and it does not care what language the command is.
 *
 * WHY
 *
 * Agents hang for two separate reasons, and both need a system behind every
 * command, not a reminder in a prompt.
 *
 * 1. A command never returns. A dev server, watcher, REPL, or an accidental
 *    infinite loop keeps running forever. The agent waits forever and never
 *    learns anything. `exec` bounds this: a hard deadline, then the process
 *    tree is killed, then output is returned anyway.
 *
 * 2. A command finishes but the agent never hears it. The work is on disk, the
 *    parent never gets the result, and the session is stuck. This one cannot be
 *    fixed by the agent, so every station writes its verdict to a file before
 *    it returns (see the station protocol) and the orchestrator reads the file.
 *
 * The root cause of (1), documented across every major harness, is that the
 * shell tool resolves a command when its stdout/stderr pipe reaches EOF rather
 * than when the process exits. A descendant that inherits the pipe and lives on
 * (npm run dev, vite, uvicorn, docker compose up, a Gradle daemon) keeps the
 * pipe open and the tool call never resolves.
 *   opencode    #32504 #20902 #22012 #24784 #36799
 *   claude-code #44783 #78782
 *   hermes      #68915
 *   pi-subagents #978
 *
 * Running "in the background" does not fix it. `&`, `nohup ... &`,
 * `Start-Process -NoNewWindow` and the shell tool's own background flag all
 * leave the daemon holding the pipe. Redirecting to a log file is not enough
 * either, because the handle is inherited even when nothing writes to it.
 * The fix is real detachment: stdio ignored, so the daemon never references the
 * tool's pipe, and this process exits so the pipe closes.
 *
 * SUBCOMMANDS
 *
 *   run.mjs exec  [--timeout <s>] [--cwd <dir>] [--log <file>] -- <cmd> [args]
 *       Run a command with a hard deadline. Always returns, with the tail of
 *       its output. Exits 0 on success, 124 on timeout, else the command's code.
 *
 *   run.mjs serve --name <slug> [--port <n>] [--health <url>] [--cwd <dir>]
 *                 [--timeout <s>] -- <cmd> [args]
 *       Start a long-lived server fully detached, wait until it answers, then
 *       return while it keeps running. Idempotent by name.
 *
 *   run.mjs stop   --name <slug> [--cwd <dir>]
 *   run.mjs status --name <slug> [--cwd <dir>]
 *   run.mjs reap   [--cwd <dir>] [--older-than <s>]
 *       Kill every server this guard started in the repo. Use between stations.
 *
 * EXAMPLES
 *
 *   node run.mjs exec --timeout 300 -- npm test
 *   node run.mjs serve --name web --port 3000 -- npm run dev
 *   node run.mjs status --name web
 *   node run.mjs stop --name web
 *   node run.mjs reap
 */

import { spawn } from "node:child_process"
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"
import { createConnection } from "node:net"
import { join, resolve } from "node:path"
import { platform } from "node:os"

const EXIT_TIMEOUT = 124 // conventional timeout exit code, so callers can spot it
const TAIL_BYTES = 8000
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Set the code and return. Calling done() on Windows tears down the
// process before buffered stderr drains, so the caller gets the exit code but
// never sees the output that explains it, which defeats the point of the guard.
function done(code) {
  process.exitCode = code
}

function parseArgs(argv) {
  const opts = {}
  let i = 0
  while (i < argv.length && argv[i] !== "--") {
    const a = argv[i]
    if (a.startsWith("--")) {
      const key = a.slice(2)
      if (["allow"].includes(key)) { (opts[key] ??= []).push(argv[++i]) }
      else opts[key] = argv[++i]
    } else {
      (opts._ ??= []).push(a)
    }
    i++
  }
  if (argv[i] === "--") opts.command = argv.slice(i + 1)
  return opts
}

function cacheDir(cwd) {
  return join(resolve(cwd), "factory", ".agent-cache", "run")
}

function pidFile(cwd, name) {
  return join(cacheDir(cwd), `${name}.pid`)
}

function alive(pid) {
  if (!pid) return false
  try { process.kill(pid, 0); return true } catch (e) { return e.code === "EPERM" }
}

/** Kill a pid and its whole tree. taskkill /T is the only reliable way on Windows. */
function killTree(pid) {
  return new Promise((resolveKill) => {
    if (platform() === "win32") {
      const r = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore", windowsHide: true })
      r.on("exit", () => resolveKill())
      r.on("error", () => { try { process.kill(pid) } catch {} resolveKill() })
      return
    }
    try { process.kill(-pid, "SIGKILL") } catch {
      try { process.kill(pid, "SIGKILL") } catch {}
    }
    resolveKill()
  })
}

function portOpen(port, host = "127.0.0.1") {
  return new Promise((res) => {
    const sock = createConnection({ port, host })
    const done = (v) => { sock.destroy(); res(v) }
    sock.setTimeout(1500)
    sock.once("connect", () => done(true))
    sock.once("timeout", () => done(false))
    sock.once("error", () => done(false))
  })
}

async function httpOk(url) {
  try { await fetch(url, { signal: AbortSignal.timeout(2500) }); return true } catch { return false }
}

async function waitReady(opts) {
  const deadline = Date.now() + Number(opts.timeout ?? 60) * 1000
  const check = opts.health ? () => httpOk(opts.health) : () => portOpen(Number(opts.port))
  while (Date.now() < deadline) {
    if (await check()) return true
    await sleep(400)
  }
  return false
}

function tailFile(file, bytes = TAIL_BYTES) {
  try {
    const all = readFileSync(file, "utf8")
    return all.length <= bytes ? all : "..." + all.slice(-bytes)
  } catch {
    return ""
  }
}

// ---------------------------------------------------------------------------

async function cmdExec(opts) {
  if (!opts.command?.length) {
    console.error("run.mjs exec: no command. Usage: run.mjs exec [--timeout s] -- <cmd> [args]")
    done(2)
  return
  }
  const cwd = resolve(opts.cwd ?? ".")
  const timeoutMs = Number(opts.timeout ?? 300) * 1000
  mkdirSync(cacheDir(cwd), { recursive: true })
  const log = resolve(opts.log ?? join(cacheDir(cwd), `${Date.now()}-cmd.log`))

  // Detach from the parent's stdio and give the child its own file, so a
  // descendant that outlives the command can never hold the tool's pipe open.
  const out = openSync(log, "a")
  const child = spawn(opts.command[0], opts.command.slice(1), {
    cwd, detached: true, stdio: ["ignore", out, out], windowsHide: true,
  })
  child.unref()

  const started = Date.now()
  let timedOut = false
  let code = null

  const exited = new Promise((res) => child.on("exit", (c) => { code = c; res() }))
  const timer = setTimeout(() => { timedOut = true; killTree(child.pid) }, timeoutMs)
  await exited
  clearTimeout(timer)
  closeSync(out)

  const elapsed = ((Date.now() - started) / 1000).toFixed(1)
  const tail = tailFile(log)

  if (timedOut) {
    console.error(`TIMEOUT  ${opts.command.join(" ")} exceeded ${opts.timeout ?? 300}s after ${elapsed}s. Process tree killed.`)
    console.error(tail)
    done(EXIT_TIMEOUT)
  return
  }

  console.error(`EXIT ${code}  ${opts.command.join(" ")} (${elapsed}s)`)
  if (tail) console.error(tail)
  else console.error("(no output)")
  done(code === null ? 1 : code)
}

// ---------------------------------------------------------------------------

async function cmdServe(opts) {
  if (!opts.command?.length || !opts.name) {
    console.error("run.mjs serve: needs --name and a command. Usage: run.mjs serve --name x [--port n|--health url] -- <cmd>")
    done(2)
  return
  }
  const cwd = resolve(opts.cwd ?? ".")
  const file = pidFile(cwd, opts.name)

  let existing = null
  try { existing = Number(readFileSync(file, "utf8").trim()) } catch {}
  if (alive(existing)) {
    console.log(`UP ${opts.name} pid=${existing} (already running)`)
    done(0)
  return
  }

  mkdirSync(cacheDir(cwd), { recursive: true })
  const log = join(cacheDir(cwd), `${opts.name}.log`)

  // stdio ignored, not piped. This is the whole fix: the daemon holds no pipe
  // of ours, so when we exit the pipe closes and the tool call resolves.
  const child = spawn(opts.command[0], opts.command.slice(1), {
    cwd, detached: true, stdio: "ignore", windowsHide: true,
  })
  child.unref()
  writeFileSync(file, String(child.pid), "utf8")

  const ready = await waitReady(opts)
  if (!ready) {
    await killTree(child.pid)
    rmSync(file, { force: true })
    console.error(`FAILED ${opts.name}: not ready after ${opts.timeout ?? 60}s. Process killed.`)
    console.error(`A port that never opens is a real failure. Report it; do not raise the timeout and retry forever.`)
    done(1)
  return
  }

  console.log(`READY ${opts.name} pid=${child.pid} ${opts.health ?? `port ${opts.port}`}`)
  console.log(`stop with: node run.mjs stop --name ${opts.name}`)
  done(0)
}

async function cmdStop(opts) {
  if (!opts.name) { console.error("run.mjs stop: --name required"); done(2) }
  const cwd = resolve(opts.cwd ?? ".")
  const file = pidFile(cwd, opts.name)
  let pid = null
  try { pid = Number(readFileSync(file, "utf8").trim()) } catch {}
  if (!alive(pid)) {
    rmSync(file, { force: true })
    console.log(`STOPPED ${opts.name} (was not running)`)
    done(0)
  }
  await killTree(pid)
  rmSync(file, { force: true })
  console.log(`STOPPED ${opts.name} pid=${pid}`)
  done(0)
}

async function cmdStatus(opts) {
  if (!opts.name) { console.error("run.mjs status: --name required"); done(2) }
  const cwd = resolve(opts.cwd ?? ".")
  let pid = null
  try { pid = Number(readFileSync(cwd && pidFile(cwd, opts.name), "utf8").trim()) } catch {}
  const up = alive(pid)
  console.log(up ? `UP ${opts.name} pid=${pid}` : `DOWN ${opts.name}`)
  done(up ? 0 : 1)
}

async function cmdReap(opts) {
  const cwd = resolve(opts.cwd ?? ".")
  const dir = cacheDir(cwd)
  if (!existsSync(dir)) { console.log("REAP nothing to clean"); done(0) }
  const olderMs = Number(opts["older-than"] ?? 0) * 1000
  const now = Date.now()
  let killed = 0
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".pid")) continue
    const full = join(dir, f)
    if (olderMs && now - statSync(full).mtimeMs < olderMs) continue
    let pid = null
    try { pid = Number(readFileSync(full, "utf8").trim()) } catch {}
    if (alive(pid)) { await killTree(pid); killed++ }
    rmSync(full, { force: true })
  }
  console.log(killed ? `REAP killed ${killed} orphaned server(s)` : "REAP nothing to clean")
  done(0)
}

// ---------------------------------------------------------------------------

const [sub, ...rest] = process.argv.slice(2)
const opts = parseArgs(rest)
const handlers = { exec: cmdExec, serve: cmdServe, stop: cmdStop, status: cmdStatus, reap: cmdReap }
const handler = handlers[sub]
if (!handler) {
  console.error(`run.mjs: unknown subcommand "${sub ?? ""}". Use: ${Object.keys(handlers).join(", ")}`)
  done(2)
}
handler(opts)
