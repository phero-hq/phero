#!/usr/bin/env node

import {
  ClientEnvironment,
  generateClientSDK,
  handleError,
  readClientConfigFile,
  SamenManifest,
  startSpinner,
} from "@samen/core"
import http from "http"
import https from "https"

process.on("unhandledRejection", handleError)

try {
  if (process.argv[2] === "build") {
    build(process.argv[3])
  } else {
    throw new Error(`Unknown command: ${process.argv[2]}`)
  }
} catch (error) {
  handleError(error)
}

async function build(apiUrl?: string): Promise<void> {
  if (!apiUrl) throw new Error("Samen URL is missing")

  const spinner = startSpinner("Building client SDK")
  const cwd = process.cwd()

  spinner.setSubTask("Reading configuration")
  const config = await readClientConfigFile(cwd)
  const env = config.env ?? ClientEnvironment.Browser

  spinner.setSubTask("Fetching manifest")
  const manifest = await fetchManifest(apiUrl + "/manifest.json")

  spinner.setSubTask("Generating SDK")
  await generateClientSDK(manifest, apiUrl, cwd, env)

  spinner.succeed("Samen is ready")
}

async function fetchManifest(url: string): Promise<SamenManifest> {
  const reqLib = url.startsWith("https") ? https : http
  return new Promise((resolve, reject) => {
    reqLib.get(url, (res) => {
      res.setEncoding("utf8")
      let body = ""
      res.on("data", (data) => {
        body += data
      })
      res.on("end", () => {
        const manifest = JSON.parse(body) as SamenManifest
        resolve(manifest)
      })
      res.on("error", reject)
    })
  })
}
