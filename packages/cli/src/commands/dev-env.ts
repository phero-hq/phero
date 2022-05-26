import { SamenCommandDevEnv } from "@samen/dev"
import { render } from "ink"
import React from "react"
import DevEnv from "../components/DevEnv"

export default function devEnv(command: SamenCommandDevEnv) {
  process.on("unhandledRejection", (error) => {
    if (command.verbose) {
      console.error(error)
    } else {
      console.error("Something went wrong, try again.")
    }
    process.exit(1)
  })

  render(React.createElement(DevEnv, { command }))
}
