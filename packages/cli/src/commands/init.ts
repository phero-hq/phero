import { PheroCommandInit } from "@phero/dev"
import { render } from "ink"
import React from "react"
import Init from "../components/Init"
import { fatalError, killAll } from "../process"

export default function init(command: PheroCommandInit) {
  process
    .on("exit", () => killAll("SIGINT"))
    .on("beforeExit", () => killAll("SIGINT"))
    .on("uncaughtException", (error) => fatalError(error))
    .on("unhandledRejection", (error) => fatalError(error))

  render(React.createElement(Init, { command }))
}
