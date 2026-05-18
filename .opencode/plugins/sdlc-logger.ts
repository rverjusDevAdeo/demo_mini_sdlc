import type { Plugin } from "@opencode-ai/plugin"
import { mkdir, appendFile } from "node:fs/promises"
import { join } from "node:path"

const SDLC_COMMANDS = new Set([
  "run_sdlc",
  "classify_issue",
  "feature",
  "bug",
  "chore",
  "implement",
  "test",
  "review",
  "document",
  "prime",
])

const PYTEST_RE = /(^|\s)pytest\b|uv run --with pytest/

function logDir(sessionId: string): string {
  return join(process.cwd(), "agents", "sdlc_logs", sessionId)
}

function extractSessionId(input: any): string {
  return (
    input?.sessionID ??
    input?.session?.id ??
    input?.session_id ??
    "unknown"
  )
}

function extractCommandName(input: any): string | undefined {
  const raw =
    input?.command ??
    input?.name ??
    input?.commandName ??
    input?.command_name
  if (typeof raw !== "string") return undefined
  const cleaned = raw.replace(/^\//, "").trim()
  return cleaned || undefined
}

function extractToolName(input: any): string | undefined {
  return input?.tool ?? input?.toolName ?? input?.tool_name
}

function extractToolInput(input: any): Record<string, any> {
  return input?.toolInput ?? input?.tool_input ?? {}
}

function classifyFilePath(p?: string): string | null {
  if (!p) return null
  if (p.endsWith("README.md")) return "document"
  if (p.endsWith("app.py") || p.endsWith("test_app.py")) return "implement"
  if (p.includes("/specs/") || p.includes("\\specs\\")) return "plan"
  return null
}

type Match = { step: string; details: Record<string, unknown> }

function isSdlcRelevant(
  event: "command.executed" | "tool.execute.before" | "tool.execute.after",
  input: any,
): Match | null {
  if (event === "command.executed") {
    const cmd = extractCommandName(input)
    if (cmd && SDLC_COMMANDS.has(cmd)) {
      return { step: cmd, details: { command: cmd } }
    }
    return null
  }

  const tool = extractToolName(input)
  if (!tool) return null
  const toolInput = extractToolInput(input)

  if (tool === "task") {
    const sub: string | undefined =
      toolInput.subagent_type ?? toolInput.subagentType
    if (sub) {
      return {
        step: sub,
        details: {
          tool,
          subagent_type: sub,
          description: toolInput.description,
        },
      }
    }
    return null
  }

  if (tool === "edit" || tool === "write") {
    const file: string | undefined =
      toolInput.filePath ?? toolInput.file_path ?? toolInput.path
    const step = classifyFilePath(file)
    if (step) return { step, details: { tool, file } }
    return null
  }

  if (tool === "bash") {
    const cmd: string =
      (toolInput.command as string) ?? (toolInput.cmd as string) ?? ""
    if (cmd && PYTEST_RE.test(cmd)) {
      return { step: "test", details: { tool, command: cmd.slice(0, 200) } }
    }
    return null
  }

  return null
}

async function writeLog(
  sessionId: string,
  event: string,
  step: string,
  details: Record<string, unknown>,
): Promise<void> {
  try {
    const dir = logDir(sessionId)
    await mkdir(dir, { recursive: true })
    const file = join(dir, "sdlc.jsonl")
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      step,
      ...details,
    })
    await appendFile(file, entry + "\n")
    console.log(`[sdlc-logger] ${step} ${event}`)
  } catch (err) {
    console.error("[sdlc-logger] failed to log:", err)
  }
}

export const SdlcLogger: Plugin = async () => {
  return {
    "command.executed": async (input: any) => {
      const match = isSdlcRelevant("command.executed", input)
      if (!match) return
      await writeLog(
        extractSessionId(input),
        "command.executed",
        match.step,
        match.details,
      )
    },
    "tool.execute.before": async (input: any) => {
      const match = isSdlcRelevant("tool.execute.before", input)
      if (!match) return
      await writeLog(
        extractSessionId(input),
        "tool.execute.before",
        match.step,
        match.details,
      )
    },
    "tool.execute.after": async (input: any) => {
      const match = isSdlcRelevant("tool.execute.after", input)
      if (!match) return
      await writeLog(
        extractSessionId(input),
        "tool.execute.after",
        match.step,
        match.details,
      )
    },
  }
}
