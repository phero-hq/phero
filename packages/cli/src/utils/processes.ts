import {
  addDevEventListener,
  ClientDevEvent,
  DevEventListenerConnectionStatus,
  ServerDevEvent,
} from "@samen/dev"
import { spawn } from "child_process"
import path from "path"

export function spawnClientWatch(
  projectPath: string,
  onEvent: (event: ClientDevEvent) => void,
  debug: boolean,
) {
  const port = 3030
  const cwd = path.resolve(projectPath)
  let hasBeenConnected = false

  function onChangeConnectionStatus(status: DevEventListenerConnectionStatus) {
    if (debug) {
      console.log({ status })
    }

    if (status === "CONNECTED") {
      hasBeenConnected = true
    } else if (hasBeenConnected) {
      // the process that we started ourselves is gone, something is seriously gone bad
      throw new Error(`client child process is disconnected (${status})`)
    } else {
      // we should be safe to ignore this
    }
  }

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
  debug: boolean,
) {
  const port = 3030
  const cwd = path.resolve(projectPath)
  let hasBeenConnected = false

  function onChangeConnectionStatus(status: DevEventListenerConnectionStatus) {
    if (debug) {
      console.log({ status })
    }

    if (status === "CONNECTED") {
      hasBeenConnected = true
    } else if (hasBeenConnected) {
      // the process that we started ourselves is gone, something is seriously gone bad
      throw new Error(`Server child process is disconnected (${status})`)
    } else {
      // we should be safe to ignore this
    }
  }

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
  // This doesn't seem to do anything, and we probably won't need it (events come in through the listener)
  // .on("close", (code) => {
  //   console.log(`child process at ${cwd} closed with code: ${code}`)
  // })
  // .on("exit", (code) => {
  //   console.log(`child process at ${cwd} exited with code: ${code}`)
  // })
  // .on("disconnect", () => {
  //   console.log(`child process at ${cwd} disconnected`)
  // })
  // .on("message", (message) => {
  //   console.log(`child process at ${cwd} messaged:`, message)
  // })
  // .on("error", (error) => {
  //   console.error(`child process at ${cwd} errored with:`, error)
  // })

  return () => {
    removeEventListener()
    proc.kill("SIGINT")
  }
}
