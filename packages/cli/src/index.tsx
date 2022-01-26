#!/usr/bin/env node

import React from "react"
import { render } from "ink"

import { parseSamenCommand } from "@samen/core"
import App from "./components/App"

const command = parseSamenCommand(process.argv.slice(2))
render(React.createElement(App, command))
