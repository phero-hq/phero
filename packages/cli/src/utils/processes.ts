import {
  DEFAULT_CLIENT_PORT,
  addDevEventListener,
  ClientDevEvent,
  DevEventListenerConnectionStatus,
  ServerDevEvent,
  DEFAULT_SERVER_PORT,
  ClientCommandWatch,
  ServerCommandServe,
} from "@samen/dev"
import { spawn } from "child_process"
import path from "path"

function fatalError(message: string) {
  console.error(message)
  process.exit(1)
}

export function spawnClientWatch(
  projectPath: string,
  onEvent: (event: ClientDevEvent) => void,
  command: ClientCommandWatch,
) {
  const cwd = path.resolve(projectPath)

  function onChangeConnectionStatus(status: DevEventListenerConnectionStatus) {
    if (command.verbose) {
      console.log({ status })
    }
  }

  const removeEventListener = addDevEventListener(
    `http://localhost:${command.port}`,
    onEvent,
    onChangeConnectionStatus,
  )

  const proc = spawn(
    "./node_modules/.bin/samen-client",
    ["watch", "--port", `${command.port}`],
    { cwd },
  )
    .on("close", (code) => {
      fatalError(`child process at ${cwd} closed with code: ${code}`)
    })
    .on("exit", (code) => {
      fatalError(`child process at ${cwd} exited with code: ${code}`)
    })
    .on("disconnect", () => {
      fatalError(`child process at ${cwd} disconnected`)
    })
    .on("error", (error) => {
      fatalError(`child process at ${cwd} errored with: ${error.message}`)
    })

  return () => {
    removeEventListener()
    proc.kill("SIGINT")
  }
}

export function spawnServerWatch(
  projectPath: string,
  onEvent: (event: ServerDevEvent) => void,
  command: ServerCommandServe,
) {
  const cwd = path.resolve(projectPath)

  function onChangeConnectionStatus(status: DevEventListenerConnectionStatus) {
    if (command.verbose) {
      console.log({ status })
    }
  }

  const removeEventListener = addDevEventListener(
    `http://localhost:${command.port}`,
    onEvent,
    onChangeConnectionStatus,
  )

  const proc = spawn(
    "./node_modules/.bin/samen-server",
    ["serve", "--port", `${command.port}`],
    { cwd },
  )
    .on("close", (code) => {
      fatalError(`child process at ${cwd} closed with code: ${code}`)
    })
    .on("exit", (code) => {
      fatalError(`child process at ${cwd} exited with code: ${code}`)
    })
    .on("disconnect", () => {
      fatalError(`child process at ${cwd} disconnected`)
    })
    .on("error", (error) => {
      fatalError(`child process at ${cwd} errored with: ${error.message}`)
    })

  return () => {
    removeEventListener()
    proc.kill("SIGINT")
  }
}
