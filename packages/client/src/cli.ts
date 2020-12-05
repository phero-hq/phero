#!/usr/bin/env node

import path from "path"
import { generateClientSDK } from "@samen/core"

process.on("unhandledRejection", (error) => {
  console.error(error)
  process.exit(1)
})

switch (process.argv[2]) {
  case "build":
    build()
    break

  default:
    throw new Error(`Unknown command: ${process.argv[2]}`)
}

async function build(): Promise<void> {
  console.log("Building Samen SDK...")
  await generateClientSDK(process.cwd())
}
