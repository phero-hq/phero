#!/usr/bin/env node

import { generateClientSDK, handleError } from "@samen/core"

process.on("unhandledRejection", handleError)

function run() {
  try {
    switch (process.argv[2]) {
      case "build":
        build()
        break

      default:
        throw new Error(`Unknown command: ${process.argv[2]}`)
    }
  } catch (error) {
    handleError(error)
  }
}

run()

async function build(): Promise<void> {
  console.log("Building Samen SDK...")
  await generateClientSDK(process.cwd())
}
