#!/usr/bin/env node

import { addClientDevEventListener, parseClientCommand } from "@samen/core"
import ClientWatchServer from "./ClientWatchServer"

const command = parseClientCommand(process.argv.slice(2))

switch (command.name) {
  case "watch": {
    addClientDevEventListener(`http://localhost:${command.port}`, console.log)
    const watchServer = new ClientWatchServer(command)
    break
  }

  case "build": {
    break
  }
}
