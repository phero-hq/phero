#!/usr/bin/env node

import { ClientCommandName, parseClientCommand } from "@phero/dev"
import build from "./commands/build"
import help from "./commands/help"
import version from "./commands/version"
import watch from "./commands/watch"

const command = parseClientCommand(process.argv.slice(2))

switch (command.name) {
  case ClientCommandName.Version:
    version()
    break

  case ClientCommandName.Help:
    help(command)
    break

  case ClientCommandName.Watch: {
    watch(command)
    break
  }

  case ClientCommandName.Build: {
    build(command)
    break
  }
}
