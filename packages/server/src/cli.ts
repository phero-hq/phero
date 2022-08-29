#!/usr/bin/env node

import { parseServerCommand, ServerCommandName } from "@samen/dev"
import buildCommand from "./commands/build"
import exportCommand from "./commands/export"
import helpCommand from "./commands/help"
import serveCommand from "./commands/serve"
import versionCommand from "./commands/version"

const command = parseServerCommand(process.argv.slice(2))

switch (command.name) {
  case ServerCommandName.Version:
    versionCommand()
    break

  case ServerCommandName.Help:
    helpCommand(command)
    break

  case ServerCommandName.Serve: {
    serveCommand(command)
    break
  }

  case ServerCommandName.Export: {
    exportCommand(command)
    break
  }

  case ServerCommandName.Build: {
    buildCommand(command)
    break
  }
}
