import { spawn } from "child_process"

interface ChildProcess {
  executableName: string // phero-*
  argv: string[] // ["watch", "--port", "3000"]
  pid: number
  cwd: string

  // https://nodejs.org/api/process.html#signal-events
  // SIGKILL: Will unconditionally terminate the process
  // SIGINT: Similar to crtl+c in stopping the process
  kill: (signal: NodeJS.Signals | number) => void
}

let childProcesses: ChildProcess[] = []

export function fatalError(error: unknown) {
  if (error instanceof Error) {
    process.stderr.write(error.message + "\n")
  } else {
    process.stderr.write("Unknown error")
  }
  killAll("SIGKILL")
  process.exit(1)
}

export function spawnNpmExec(
  executableName: string,
  argv: string[],
  cwd: string,
  onLog?: (data: string) => void,
): ChildProcess {
  const { kill, pid, stdout, stderr } = spawn(
    "npm",
    ["exec", "--", executableName, ...argv],
    { cwd },
  )
    .on("close", (code) => {
      throw new Error(`${executableName} closed with code: ${code}`)
    })
    .on("exit", (code, signal) => {
      throw new Error(`${executableName} exited with code: ${code} ${signal}`)
    })
    .on("disconnect", () => {
      throw new Error(`${executableName} disconnected`)
    })
    .on("uncaughtException", () => {
      throw new Error(`uncaughtException in ${executableName}`)
    })
    .on("error", (error) => {
      throw new Error(
        `${executableName} errored with message: ${error.message}`,
      )
    })

  stdout.on("data", (data) => onLog?.(data.toString().trim()))
  stderr.on("data", (data) => onLog?.(data.toString().trim()))

  if (pid === undefined) {
    throw new Error(`Can't create process for ${executableName}.`)
  }

  const childProcess: ChildProcess = {
    executableName,
    argv,
    cwd,
    pid,
    kill,
  }

  childProcesses.push(childProcess)

  return childProcess
}

export function killAll(signal: NodeJS.Signals) {
  for (const proc of childProcesses) {
    proc.kill(signal)
  }
  childProcesses = []
}
