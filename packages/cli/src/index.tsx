#!/usr/bin/env node

import { parseSamenCommand } from "@samen/dev"
import devEnv from "./commands/dev-env"
import help from "./commands/help"
import version from "./commands/version"

const command = parseSamenCommand(process.argv.slice(2))

switch (command.name) {
  case "version":
    version()
    break

  case "help":
    help()
    break

  case "dev-env":
    devEnv(command)
    break
}
