#!/usr/bin/env node

import { parsePheroCommand, PheroCommandName } from "@phero/dev"
import devEnv from "./commands/dev-env"
import help from "./commands/help"
import init from "./commands/init"
import version from "./commands/version"
import { fatalError, redirectToClient, redirectToServer } from "./process"
import checkAndWarnForVersions from "./utils/checkAndWarnForVersions"

const command = parsePheroCommand(process.argv.slice(2))

switch (command.name) {
  case PheroCommandName.Version:
    version()
    break

  case PheroCommandName.Help:
    checkAndWarnForVersions([process.cwd()], console.warn)
      .then(() => help(command))
      .catch(fatalError)
    break

  case PheroCommandName.DevEnv:
    devEnv(command)
    break

  case PheroCommandName.Init:
    init(command)
    break

  case PheroCommandName.Client:
    checkAndWarnForVersions([process.cwd()], console.warn)
      .then(() => redirectToClient(command.argv))
      .catch(fatalError)

    break

  case PheroCommandName.Server:
    checkAndWarnForVersions([process.cwd()], console.warn)
      .then(() => redirectToServer(command.argv))
      .catch(fatalError)
    break
}
