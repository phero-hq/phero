#!/usr/bin/env node

import React from "react"
import App from "./App"
import { render } from "ink"

render(React.createElement(App, {}))

// import { addClientDevEventListener } from "@samen/core"
// import { spawn } from "child_process"
// import path from "path"

// const port = 4040
// const projectPath = "./client"
// console.log({ projectPath: path.resolve(projectPath) })

// const removeEventListener = addClientDevEventListener(
//   `http://localhost:${port}`,
//   console.log,
// )

// const child = spawn(
//   "./node_modules/.bin/samen-client",
//   ["watch", "--quiet", "--port", `${port}`],
//   { cwd: projectPath },
// )
//   .on("close", (code) =>
//     console.log(`child process at ${projectPath} closed with code: ${code}`),
//   )
//   .on("exit", (code) =>
//     console.log(`child process at ${projectPath} exited with code: ${code}`),
//   )
//   .on("disconnect", () =>
//     console.log(`child process at ${projectPath} disconnected`),
//   )
//   .on("message", (message) =>
//     console.log(`child process at ${projectPath} messaged:`, message),
//   )
//   .on("error", (error) =>
//     console.error(`child process at ${projectPath} errored with:`, error),
//   )
