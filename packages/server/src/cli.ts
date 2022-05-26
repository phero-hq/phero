#!/usr/bin/env node

import { parseServerCommand } from "@samen/dev"
import build from "./commands/build"
import help from "./commands/help"
import serve from "./commands/serve"
import version from "./commands/version"

const command = parseServerCommand(process.argv.slice(2))

switch (command.name) {
  case "version":
    version()
    break

  case "help":
    help()
    break

  case "serve": {
    serve(command)
    break
  }

  case "build": {
    build()
    break
  }
}
