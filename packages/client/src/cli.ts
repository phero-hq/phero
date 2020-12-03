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
  const cwd = process.cwd()
  const manifestPath = path.join(cwd, "samen-manifest.json")
  const sdkPath = path.join(cwd, "node_modules/@samen/client/build/sdk")

  console.log("Building Samen SDK...")
  await generateClientSDK(manifestPath, sdkPath)
}
