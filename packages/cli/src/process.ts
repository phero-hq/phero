import { ClientCommandWatch, ServerCommandServe } from "@phero/dev"
import { ChildProcessWithoutNullStreams, spawn } from "child_process"

type ExecutableName = "phero-server" | "phero-client"
type Signal = Extract<NodeJS.Signals, "SIGKILL" | "SIGINT">

interface ChildProcess {
  executableName: ExecutableName

  // https://nodejs.org/api/process.html#signal-events
  // SIGKILL: Will unconditionally terminate the process
  // SIGINT: Similar to crtl+c in stopping the process
  kill: (signal: Signal) => void
}

let childProcesses: ChildProcess[] = []

export function spawnClientDevEnv(
  command: ClientCommandWatch,
  cwd: string,
): ChildProcess {
  const argv = ["exec", "--", "phero-client", "watch", `--port=${command.port}`]
  const createdChildProcess = spawn("npm", argv, { cwd })
  return handleDevEnvChildProcess(createdChildProcess, "phero-client")
}

export function spawnServerDevEnv(
  command: ServerCommandServe,
  cwd: string,
  onLog: (data: string) => void,
): ChildProcess {
  const argv = ["exec", "--", "phero-server", "serve", `--port=${command.port}`]
  const createdChildProcess = spawn("npm", argv, { cwd })

  createdChildProcess.stdout.on("data", (data) =>
    onLog?.(data.toString().trim()),
  )
  createdChildProcess.stderr.on("data", (data) =>
    onLog?.(data.toString().trim()),
  )

  return handleDevEnvChildProcess(createdChildProcess, "phero-server")
}

function handleDevEnvChildProcess(
  createdChildProcess: ChildProcessWithoutNullStreams,
  executableName: ExecutableName,
): ChildProcess {
  const { kill, pid } = createdChildProcess

  createdChildProcess
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

  if (pid === undefined) {
    throw new Error(`Can't create process for ${executableName}.`)
  }

  const storedChildProcess: ChildProcess = {
    executableName,
    kill,
  }

  childProcesses.push(storedChildProcess)

  return storedChildProcess
}

export function fatalError(error: unknown) {
  if (error instanceof Error) {
    process.stderr.write(error.message + "\n")
  } else {
    process.stderr.write("Unknown error")
  }
  killAll("SIGKILL")
  process.exit(1)
}

export function killAll(signal: Signal) {
  for (const proc of childProcesses) {
    proc.kill(signal)
  }
  childProcesses = []
}

export function redirectToServer(argv: string[]) {
  spawn("npm", ["exec", "--", "phero-server", ...argv], {
    cwd: process.cwd(),
    detached: false,
    stdio: "inherit",
  })
}

export function redirectToClient(argv: string[]) {
  spawn("npm", ["exec", "--", "phero-client", ...argv], {
    cwd: process.cwd(),
    detached: false,
    stdio: "inherit",
  })
}
