#!/usr/bin/env node

import { Environment, handleError } from "@samen/core"
import serve from "./commands/serve"
import { getManifestPath } from "./utils/paths"

process.on("unhandledRejection", handleError)

try {
  const manifestPath = getManifestPath()
  serve(Environment.production, manifestPath)
} catch (error) {
  handleError(error)
}
