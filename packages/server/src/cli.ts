#!/usr/bin/env node

import { addServerDevEventListener, parseServerCommand } from "@samen/core"
import DevServer from "./DevServer"

const command = parseServerCommand(process.argv.slice(2))

switch (command.name) {
  case "serve": {
    addServerDevEventListener(`http://localhost:${command.port}`, console.log)
    const devServer = new DevServer(command, process.cwd())
    break
  }

  case "build": {
    break
  }
}
