import { PheroCommandDevEnv } from "lib"
import { render } from "ink"
import React from "react"
import DevEnv from "../components/DevEnv"
import { fatalError, killAll } from "../process"

export default function devEnv(command: PheroCommandDevEnv) {
  process
    .on("exit", () => killAll("SIGINT"))
    .on("beforeExit", () => killAll("SIGINT"))
    .on("uncaughtException", (error) => fatalError(error))
    .on("unhandledRejection", (error) => fatalError(error))

  render(React.createElement(DevEnv, { command }))
}
