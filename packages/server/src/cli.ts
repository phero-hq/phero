#!/usr/bin/env node

import { parseServerCommand, ServerCommandName } from "@samen/dev"
import build from "./commands/build"
import help from "./commands/help"
import serve from "./commands/serve"
import version from "./commands/version"

const command = parseServerCommand(process.argv.slice(2))

switch (command.name) {
  case ServerCommandName.Version:
    version()
    break

  case ServerCommandName.Help:
    help(command)
    break

  case ServerCommandName.Serve: {
    serve(command)
    break
  }

  case ServerCommandName.Build: {
    build()
    break
  }
}
