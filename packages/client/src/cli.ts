#!/usr/bin/env node

import { ClientEnvironment, handleError } from "@samen/core"
import build from "./commands/build"
import watch from "./commands/watch"

process.on("unhandledRejection", handleError)

try {
  const environment = process.argv.includes("--node")
    ? ClientEnvironment.Node
    : ClientEnvironment.Browser
  const args = process.argv.filter((a) => !["--node", "--browser"].includes(a))

  const runBuild = () => build(environment, args[3])

  switch (args[2]) {
    case "build":
      runBuild()
      break

    case "watch":
      watch(runBuild, args[3])
      break

    default:
      throw new Error(`Unknown command: ${args[2]}`)
  }
} catch (error) {
  handleError(error)
}
