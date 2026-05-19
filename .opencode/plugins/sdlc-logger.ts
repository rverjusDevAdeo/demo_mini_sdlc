import type { Plugin } from "@opencode-ai/plugin"
import { mkdir, appendFile } from "node:fs/promises"
import { join } from "node:path"

function logDir(sessionId: string): string {
  return join(process.cwd(), "agents", "sdlc_logs", sessionId)
}

function extractSessionId(input: any): string {
  return (
    input?.sessionID ??
    input?.session?.id ??
    input?.session_id ??
    input?.message?.sessionID ??
    input?.part?.sessionID ??
    "unknown"
  )
}

function truncate(s: any, n: number): string {
  if (typeof s !== "string") return ""
  return s.length > n ? s.slice(0, n) + "…(+" + (s.length - n) + ")" : s
}

function compactArgs(tool: string, args: any): Record<string, unknown> {
  if (!args || typeof args !== "object") return {}
  if (tool === "edit") {
    return {
      file: args.filePath,
      old: truncate(args.oldString, 120),
      new: truncate(args.newString, 120),
    }
  }
  if (tool === "write") {
    return {
      file: args.filePath,
      size: typeof args.content === "string" ? args.content.length : null,
    }
  }
  if (tool === "bash") {
    return {
      cmd: truncate(args.command, 300),
      desc: args.description,
    }
  }
  if (tool === "read") {
    return { file: args.filePath }
  }
  if (tool === "glob" || tool === "grep") {
    return { pattern: args.pattern, path: args.path }
  }
  if (tool === "task") {
    return {
      subagent_type: args.subagent_type ?? args.subagentType,
      desc: truncate(args.description ?? args.prompt, 200),
    }
  }
  // catch-all: keep first few keys, truncate string values
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(args).slice(0, 5)) {
    const v = (args as any)[k]
    out[k] = typeof v === "string" ? truncate(v, 200) : v
  }
  return out
}

// Tracks tool.execute.before timestamps so tool.execute.after can compute duration.
const callStart = new Map<string, number>()

// Dedup signatures per session — message.part.updated fires repeatedly as text streams in,
// so the same banner / verdict / iteration would otherwise re-fire on every update.
const seenSignals = new Map<string, Set<string>>()

function once(sessionId: string, sig: string): boolean {
  let s = seenSignals.get(sessionId)
  if (!s) {
    s = new Set()
    seenSignals.set(sessionId, s)
  }
  if (s.has(sig)) return false
  s.add(sig)
  return true
}

async function writeLine(
  sessionId: string,
  line: Record<string, unknown>,
): Promise<void> {
  try {
    const dir = logDir(sessionId)
    await mkdir(dir, { recursive: true })
    const file = join(dir, "sdlc.jsonl")
    const entry = JSON.stringify({ t: new Date().toISOString(), ...line })
    await appendFile(file, entry + "\n")
  } catch {
    /* silent — never crash opencode because of logging */
  }
}

function extractText(input: any): string {
  const candidates = [
    input?.text,
    input?.content,
    input?.part?.text,
    input?.part?.content,
    input?.message?.text,
    input?.message?.content,
  ]
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c
  }
  // Some payloads expose parts as array of {text|content}
  const parts = input?.message?.parts ?? input?.parts
  if (Array.isArray(parts)) {
    const joined = parts
      .map((p: any) => p?.text ?? p?.content ?? "")
      .filter((s: any) => typeof s === "string")
      .join("\n")
    if (joined.length > 0) return joined
  }
  return ""
}

// Match SDLC-level signals embedded in the model's streamed text output.
// Each match is deduped per-session by `${offset}:${kind}:${captured-key}` so the same
// banner doesn't re-emit on every streaming chunk.
function matchSignals(
  sessionId: string,
  text: string,
): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = []

  // Phase banner: "══════ PHASE 1 : CLASSIFY ══════" or "PHASE 3.5 : INJECT BUG"
  const phaseRe = /PHASE\s+([\d.]+)\s*:\s*([A-Z_][A-Z_0-9 -]*?)\s*(?:═|$|\n)/g
  let m: RegExpExecArray | null
  while ((m = phaseRe.exec(text)) !== null) {
    if (once(sessionId, `${m.index}:phase:${m[1]}:${m[2].trim()}`)) {
      out.push({
        kind: "phase.entered",
        phase_num: m[1],
        phase: m[2].trim(),
      })
    }
  }

  // Loop iter: "── TEST FIX-LOOP iter 1/3 ──"
  const loopRe = /(TEST FIX-LOOP|REVIEW PATCH-LOOP)\s+iter\s+(\d+)\/(\d+)/g
  while ((m = loopRe.exec(text)) !== null) {
    if (once(sessionId, `${m.index}:loop:${m[1]}:${m[2]}/${m[3]}`)) {
      out.push({
        kind: "loop.iteration",
        loop: m[1] === "TEST FIX-LOOP" ? "test-fix" : "review-patch",
        iter: Number(m[2]),
        max: Number(m[3]),
      })
    }
  }

  // Test result: "TEST RESULT: passed 5 / failed 1"
  const testRe = /TEST RESULT:\s+passed\s+(\d+)\s*\/\s*failed\s+(\d+)/g
  while ((m = testRe.exec(text)) !== null) {
    if (once(sessionId, `${m.index}:test:${m[1]}/${m[2]}`)) {
      out.push({
        kind: "test.result",
        passed: Number(m[1]),
        failed: Number(m[2]),
      })
    }
  }

  // Review verdict: "REVIEW VERDICT: PASS" | "PASS_WITH_NITS" | "FAIL"
  const reviewRe = /REVIEW VERDICT:\s+(PASS_WITH_NITS|PASS|FAIL)\b/g
  while ((m = reviewRe.exec(text)) !== null) {
    if (once(sessionId, `${m.index}:verdict:${m[1]}`)) {
      out.push({ kind: "review.verdict", verdict: m[1] })
    }
  }

  // INJECT BUG marker (PHASE 3.5)
  const bugRe = /BUG INJECTED\s*[—-]\s*([^\n]+)/g
  while ((m = bugRe.exec(text)) !== null) {
    if (once(sessionId, `${m.index}:bug`)) {
      out.push({ kind: "bug.injected", detail: m[1].trim() })
    }
  }

  // SDLC complete (final banner)
  const doneRe = /SDLC COMPLETE/g
  while ((m = doneRe.exec(text)) !== null) {
    if (once(sessionId, `${m.index}:sdlc.done`)) {
      out.push({ kind: "sdlc.done" })
    }
  }

  return out
}

export const SdlcLogger: Plugin = async () => {
  return {
    "tool.execute.before": async (input: any) => {
      const callID = input?.callID ?? input?.call_id
      if (typeof callID === "string") {
        callStart.set(callID, Date.now())
      }
    },
    "tool.execute.after": async (input: any) => {
      const sessionId = extractSessionId(input)
      const tool = String(input?.tool ?? "unknown")
      const callID = input?.callID ?? input?.call_id
      const args =
        input?.args ?? input?.toolInput ?? input?.tool_input ?? {}
      let duration_ms: number | null = null
      if (typeof callID === "string" && callStart.has(callID)) {
        duration_ms = Date.now() - (callStart.get(callID) as number)
        callStart.delete(callID)
      }
      await writeLine(sessionId, {
        kind: "tool",
        tool,
        ...compactArgs(tool, args),
        duration_ms,
        callID,
      })
    },
    "message.part.updated": async (input: any) => {
      const sessionId = extractSessionId(input)
      const text = extractText(input)
      if (!text) return
      for (const ev of matchSignals(sessionId, text)) {
        await writeLine(sessionId, ev)
      }
    },
  }
}

export default SdlcLogger
