#!/usr/bin/env node

import { runDevServer, build } from "./commands"

switch (process.argv[2]) {
  case "dev":
    runDevServer()
    break
  case "build":
    build()
    break

  default:
    throw new Error(`Unknown command: process.argv[2]`)
}
