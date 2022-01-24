#!/usr/bin/env node

import { addClientDevEventListener, parseClientCommand } from "@samen/core"
import ClientWatchServer from "./ClientWatchServer"
import buildClient from "./utils/buildClient"

const command = parseClientCommand(process.argv.slice(2))

switch (command.name) {
  case "watch": {
    addClientDevEventListener(`http://localhost:${command.port}`, console.log)
    const watchServer = new ClientWatchServer(command)
    break
  }

  case "build": {
    if ("path" in command.server) {
      console.log(`Building client from server at: ${command.server.path}`)
    } else if ("url" in command.server) {
      console.log(`Building client from server at: ${command.server.url}`)
    } else {
      throw new Error("unexpected server config")
    }

    buildClient(command.server)
      .then(() => console.log("Client is ready"))
      .catch(console.error)
    break
  }
}
