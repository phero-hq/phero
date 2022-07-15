#!/usr/bin/env node

import { parseSamenCommand, SamenCommandName } from "@samen/dev"
import devEnv from "./commands/dev-env"
import help from "./commands/help"
import init from "./commands/init"
import redirect from "./commands/redirect"
import version from "./commands/version"
import { fatalError } from "./process"
import checkAndWarnForVersions from "./utils/checkAndWarnForVersions"

const command = parseSamenCommand(process.argv.slice(2))

switch (command.name) {
  case SamenCommandName.Version:
    version()
    break

  case SamenCommandName.Help:
    checkAndWarnForVersions([process.cwd()], console.warn)
      .then(() => help(command))
      .catch(fatalError)
    break

  case SamenCommandName.DevEnv:
    devEnv(command)
    break

  case SamenCommandName.Init:
    init(command)
    break

  case SamenCommandName.Client:
    checkAndWarnForVersions([process.cwd()], console.warn)
      .then(() => redirect("./node_modules/.bin/samen-client", command.argv))
      .catch(fatalError)

    break

  case SamenCommandName.Server:
    checkAndWarnForVersions([process.cwd()], console.warn)
      .then(() => redirect("./node_modules/.bin/samen-server", command.argv))
      .catch(fatalError)
    break
}
