#!/usr/bin/env node

import React from "react"
import App from './App'
import { render } from "ink"
import meow from "meow"

const cli = meow(`
	Usage
	  $ cli

	Options
		--name  Your name

	Examples
	  $ cli --name=Jane
	  Hello, Jane
`)

render(React.createElement(App, cli.flags))
