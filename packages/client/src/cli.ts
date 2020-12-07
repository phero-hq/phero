#!/usr/bin/env node

import { generateClientSDK, getEnvironment, handleError } from "@samen/core"

process.on("unhandledRejection", handleError)

try {
  const environment = getEnvironment()

  if (process.argv[2] === "build") {
    console.log(`Building client in ${environment} mode`)
    generateClientSDK(process.cwd())
  } else {
    throw new Error(`Unknown command: ${process.argv[2]}`)
  }
} catch (error) {
  handleError(error)
}
