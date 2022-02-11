#!/usr/bin/env node

import { addDevEventListener, parseServerCommand } from "@samen/dev"
import DevServer from "./DevServer"

const command = parseServerCommand(process.argv.slice(2))

switch (command.name) {
  case "serve": {
    if (!command.quiet) {
      addDevEventListener(
        `http://localhost:${command.port}`,
        console.log,
        console.log,
      )
    }
    const devServer = new DevServer(command, process.cwd())
    break
  }

  case "build": {
    break
  }
}
