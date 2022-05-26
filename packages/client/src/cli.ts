#!/usr/bin/env node

import { parseClientCommand } from "@samen/dev"
import build from "./commands/build"
import help from "./commands/help"
import version from "./commands/version"
import watch from "./commands/watch"

const command = parseClientCommand(process.argv.slice(2))

switch (command.name) {
  case "version":
    version()
    break

  case "help":
    help()
    break

  case "watch": {
    watch(command)
    break
  }

  case "build": {
    build(command)
    break
  }
}
