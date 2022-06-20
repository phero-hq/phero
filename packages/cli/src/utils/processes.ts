import {
  DEFAULT_CLIENT_PORT,
  addDevEventListener,
  ClientDevEvent,
  DevEventListenerConnectionStatus,
  ServerDevEvent,
  DEFAULT_SERVER_PORT,
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
  debug: boolean,
) {
  const port = DEFAULT_CLIENT_PORT // TODO: auto increment
  const cwd = path.resolve(projectPath)

  function onChangeConnectionStatus(status: DevEventListenerConnectionStatus) {
    if (debug) {
      console.log({ status })
    }
  }

  const removeEventListener = addDevEventListener(
    `http://localhost:${port}`,
    onEvent,
    onChangeConnectionStatus,
  )

  const proc = spawn(
    "./node_modules/.bin/samen-client",
    ["watch", "--port", `${port}`],
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
  debug: boolean,
) {
  const port = DEFAULT_SERVER_PORT
  const cwd = path.resolve(projectPath)

  function onChangeConnectionStatus(status: DevEventListenerConnectionStatus) {
    if (debug) {
      console.log({ status })
    }
  }

  const removeEventListener = addDevEventListener(
    `http://localhost:${port}`,
    onEvent,
    onChangeConnectionStatus,
  )

  const proc = spawn(
    "./node_modules/.bin/samen-server",
    ["serve", "--port", `${port}`],
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
