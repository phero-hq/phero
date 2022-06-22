import { spawn } from "child_process"

interface ChildProcess {
  executable: string // ./node_modules/.bin/samen-*
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

export function spawnChildProcess(
  executable: string,
  argv: string[],
  cwd: string,
): ChildProcess {
  const { kill, pid, stderr } = spawn(executable, argv, { cwd })
    .on("close", (code) => {
      throw new Error(`${executable} closed with code: ${code}`)
    })
    .on("exit", (code, signal) => {
      throw new Error(`${executable} exited with code: ${code} ${signal}`)
    })
    .on("disconnect", () => {
      throw new Error(`${executable} disconnected`)
    })
    .on("uncaughtException", () => {
      throw new Error(`uncaughtException in ${executable}`)
    })
    .on("error", (error) => {
      throw new Error(`${executable} errored with message: ${error.message}`)
    })

  stderr.on("data", (data) => {
    throw new Error(data.toString().trim())
  })

  const childProcess = {
    executable,
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
