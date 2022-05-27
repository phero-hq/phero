#!/usr/bin/env node

import { parseSamenCommand, SamenCommandName } from "@samen/dev"
import devEnv from "./commands/dev-env"
import help from "./commands/help"
import redirect from "./commands/redirect"
import version from "./commands/version"

const command = parseSamenCommand(process.argv.slice(2))

switch (command.name) {
  case SamenCommandName.Version:
    version()
    break

  case SamenCommandName.Help:
    help()
    break

  case SamenCommandName.DevEnv:
    devEnv(command)
    break

  case SamenCommandName.Client:
    redirect("./node_modules/.bin/samen-client", command.argv)
    break

  case SamenCommandName.Server:
    redirect("./node_modules/.bin/samen-server", command.argv)
    break
}
