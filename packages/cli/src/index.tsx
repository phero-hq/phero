#!/usr/bin/env node

import { parseSamenCommand } from "@samen/dev"
import { render } from "ink"
import React from "react"
import App from "./components/App"

const command = parseSamenCommand(process.argv.slice(2))

process.on("unhandledRejection", (error) => {
  if (command.debug) {
    console.error(error)
  } else {
    console.error("Something went wrong, try again.")
  }
  process.exit(1)
})

render(React.createElement(App, command))
