#!/usr/bin/env node

import { Environment, handleError } from "@samen/core"
import serve from "./commands/serve"

process.on("unhandledRejection", handleError)

try {
  serve(Environment.production)
} catch (error) {
  handleError(error)
}
