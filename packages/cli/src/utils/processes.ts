import {
  addDevEventListener,
  ClientDevEvent,
  DevEventListenerConnectionStatus,
  ServerDevEvent,
} from "@samen/core"
import path from "path"
import { spawn } from "child_process"

export function spawnClientWatch(
  projectPath: string,
  onEvent: (event: ClientDevEvent) => void,
  onChangeConnectionStatus: (status: DevEventListenerConnectionStatus) => void,
) {
  const port = 4040
  const cwd = path.resolve(projectPath)

  const removeEventListener = addDevEventListener(
    `http://localhost:${port}`,
    onEvent,
    onChangeConnectionStatus,
  )

  const proc = spawn(
    "./node_modules/.bin/samen-client",
    ["watch", "--quiet", "--port", `${port}`],
    { cwd },
  )
    .on("close", (code) => {
      console.log(`child process at ${cwd} closed with code: ${code}`)
    })
    .on("exit", (code) => {
      console.log(`child process at ${cwd} exited with code: ${code}`)
    })
    .on("disconnect", () => {
      console.log(`child process at ${cwd} disconnected`)
    })
    .on("message", (message) => {
      console.log(`child process at ${cwd} messaged:`, message)
    })
    .on("error", (error) => {
      console.error(`child process at ${cwd} errored with:`, error)
    })

  return () => {
    removeEventListener()
    proc.kill("SIGINT")
  }
}

export function spawnServerWatch(
  projectPath: string,
  onEvent: (event: ServerDevEvent) => void,
  onChangeConnectionStatus: (status: DevEventListenerConnectionStatus) => void,
) {
  const port = 3030
  const cwd = path.resolve(projectPath)

  const removeEventListener = addDevEventListener(
    `http://localhost:${port}`,
    onEvent,
    onChangeConnectionStatus,
  )

  const proc = spawn(
    "./node_modules/.bin/samen-server",
    ["serve", "--quiet", "--port", `${port}`],
    { cwd },
  )
    .on("close", (code) => {
      console.log(`child process at ${cwd} closed with code: ${code}`)
    })
    .on("exit", (code) => {
      console.log(`child process at ${cwd} exited with code: ${code}`)
    })
    .on("disconnect", () => {
      console.log(`child process at ${cwd} disconnected`)
    })
    .on("message", (message) => {
      console.log(`child process at ${cwd} messaged:`, message)
    })
    .on("error", (error) => {
      console.error(`child process at ${cwd} errored with:`, error)
    })

  return () => {
    removeEventListener()
    proc.kill("SIGINT")
  }
}
