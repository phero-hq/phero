#!/usr/bin/env node

import { addEventListener, parseServerCommand } from "@samen/core"
import DevServer from "./DevServer"

const command = parseServerCommand(process.argv.slice(2))

switch (command.name) {
  case "serve": {
    const devServer = new DevServer(command, process.cwd())
    break
  }

  case "build": {
    break
  }
}
