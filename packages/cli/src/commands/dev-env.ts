import { SamenCommandDevEnv } from "@samen/dev"
import { render } from "ink"
import React from "react"
import DevEnv from "../components/DevEnv"
import { fatalError, killAll } from "../process"

export default function devEnv(command: SamenCommandDevEnv) {
  process
    .on("SIGINT", () => killAll("SIGINT"))
    .on("SIGQUIT", () => killAll("SIGQUIT"))
    .on("SIGTERM", () => killAll("SIGTERM"))
    .on("exit", () => killAll("SIGINT"))
    .on("beforeExit", () => killAll("SIGINT"))
    .on("uncaughtException", (error) => fatalError(error))
    .on("unhandledRejection", (error) => fatalError(error))

  render(React.createElement(DevEnv, { command }))
}
