#!/usr/bin/env node

import { handleError } from "@samen/core"

import serve from "./commands/serve"
import build from "./commands/build"
import buildClients from "./commands/buildClients"

process.on("unhandledRejection", handleError)

function run() {
  try {
    switch (process.argv[2]) {
      case "serve":
        serve()
        break

      case "build":
        build()
        break

      case "buildClients":
        buildClients()
        break

      default:
        throw new Error(`Unknown command: ${process.argv[2]}`)
    }
  } catch (error) {
    handleError(error)
  }
}

run()
