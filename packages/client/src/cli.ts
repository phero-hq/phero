#!/usr/bin/env node

// import { fstat } from "fs/promises"
import { promises as fs } from "fs"

import {
  ClientEnvironment,
  generateClientSDK,
  handleError,
  paths,
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

async function build(manifestLocation?: string): Promise<void> {
  const spinner = startSpinner("Building client SDK")
  const cwd = process.cwd()

  spinner.setSubTask("Reading configuration")
  const config = await readClientConfigFile(cwd)
  const env = config.env ?? ClientEnvironment.Browser

  spinner.setSubTask("Fetching manifest")
  const manifest = await getManifest(manifestLocation)
  console.log({ manifest })
  spinner.setSubTask("Generating SDK")
  await generateClientSDK(manifest, cwd, env)

  spinner.succeed("Samen is ready")
}

async function getManifest(location?: string): Promise<SamenManifest> {
  if (!location) {
    return getManifestFromUrl("http://localhost:4000/manifest.json")
  }
  if (location?.startsWith("http")) {
    return getManifestFromUrl(location)
  }
  return getManifestFromFS(location)
}

async function getManifestFromUrl(url: string): Promise<SamenManifest> {
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

async function getManifestFromFS(path: string): Promise<SamenManifest> {
  const manifest = await fs.readFile(path)
  if (!manifest) throw new Error(`No manifest file found at ${path}`)
  return JSON.parse(manifest.toString()) as SamenManifest
}
