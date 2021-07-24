import {
  ClientEnvironment,
  generateClientSDK,
  SamenManifest,
  startSpinner,
} from "@samen/core"
import { promises as fs } from "fs"
import http from "http"
import https from "https"

export default async function build(
  environment: ClientEnvironment,
  manifestLocation?: string,
): Promise<void> {
  const spinner = startSpinner("Building client SDK")
  const cwd = process.cwd()

  spinner.setSubTask("Fetching manifest")
  const manifest = await getManifest(manifestLocation)

  spinner.setSubTask("Generating SDK")
  await generateClientSDK(manifest, cwd, environment)

  spinner.succeed("Samen SDK is ready")
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
