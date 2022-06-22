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
  const { kill, pid } = spawn(executable, argv, { cwd })
    .on("close", (code) => {
      fatalError(`${cwd + executable} closed with code: ${code}`)
    })
    .on("exit", (code) => {
      fatalError(`${cwd + executable} exited with code: ${code}`)
    })
    .on("disconnect", () => {
      fatalError(`${cwd + executable} disconnected`)
    })
    .on("error", (error) => {
      fatalError(`${cwd + executable} errored with message: ${error.message}`)
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
