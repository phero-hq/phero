import { parseManifest } from "@phero/core"
import { ClientCommandBuild, ClientServerLocation } from "lib"
import { promises as fs } from "fs"
import http from "http"
import https from "https"
import generateClientSource from "../code-gen/generateClientSource"
import writeClientSource from "./writeClientSource"

export default async function buildClient(
  server: ClientServerLocation,
): Promise<void> {
  const manifestSource = await getManifestSource(server)
  const manifest = parseManifest(manifestSource)
  const clientSource = generateClientSource(manifest.result, manifest.program)
  await writeClientSource(clientSource)
}

async function getManifestSource(
  server: ClientCommandBuild["server"],
): Promise<string> {
  if ("path" in server) {
    return getManifestFromPath(server.path)
  } else if ("url" in server) {
    return getManifestFromUrl(server.url)
  } else {
    throw new Error(`Unexpected server config: ${JSON.stringify(server)}`)
  }
}

async function getManifestFromUrl(serverUrl: string): Promise<string> {
  const url = `${serverUrl}/manifest`
  const reqLib = url.startsWith("https") ? https : http
  return new Promise((resolve, reject) => {
    reqLib.get(url, (res) => {
      res.setEncoding("utf8")
      let body = ""
      res.on("data", (data) => {
        body += data
      })
      res.on("end", () => resolve(body))
      res.on("error", reject)
    })
  })
}

async function getManifestFromPath(serverPath: string): Promise<string> {
  const path = `${serverPath}/phero-manifest.d.ts`

  try {
    await fs.access(path)
  } catch (error) {
    throw new Error(`No manifest file found at ${path}`)
  }

  return (await fs.readFile(path)).toString()
}
