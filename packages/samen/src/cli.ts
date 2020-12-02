#!/usr/bin/env node

import serve from "./commands/serve"
import build from "./commands/build"

process.on("unhandledRejection", (error) => {
  console.error(error)
  process.exit(1)
})

switch (process.argv[2]) {
  case "serve":
    serve()
    break

  case "build":
    build()
    break

  default:
    throw new Error(`Unknown command: ${process.argv[2]}`)
}
