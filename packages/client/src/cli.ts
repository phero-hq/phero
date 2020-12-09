#!/usr/bin/env node

import { promises as fs } from "fs"
import {
  ClientConfig,
  generateClientSDK,
  getEnvironment,
  handleError,
  paths,
} from "@samen/core"

process.on("unhandledRejection", handleError)

try {
  if (process.argv[2] === "build") {
    build()
  } else {
    throw new Error(`Unknown command: ${process.argv[2]}`)
  }
} catch (error) {
  handleError(error)
}

async function build(): Promise<void> {
  const cwd = process.cwd()
  const environment = getEnvironment()
  generateClientSDK(environment, cwd)
}
