#!/usr/bin/env node

import { parseClientCommand } from "@samen/core"
import ClientWatchServer from "./ClientWatchServer"

const command = parseClientCommand(process.argv.slice(2))

switch (command.name) {
  case "watch": {
    const watchServer = new ClientWatchServer(command)
    break
  }

  case "build": {
    break
  }
}
