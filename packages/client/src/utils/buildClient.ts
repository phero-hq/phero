import {
  BuildClientCommand,
  ClientCommand,
  getDeclarationForVersion,
  parseAppDeclarationFileContent,
} from "@samen/core"
import { promises as fs } from "fs"
import http from "http"
import https from "https"
import path from "path"
import getClientSource from "./getClientSource"
import writeClientSource from "./writeClientSource"

export default async function buildClient(
  server: ClientCommand["server"],
): Promise<void> {
  const manifest = await getManifestSource(server)
  const declaration = parseAppDeclarationFileContent(manifest)
  const declarationVersion = getDeclarationForVersion(declaration.result)
  const clientSource = getClientSource(
    declarationVersion,
    declaration.typeChecker,
  )
  await writeClientSource(
    path.join("node_modules", "@samen", "client", "generated"),
    clientSource,
  )
}

async function getManifestSource(
  server: BuildClientCommand["server"],
): Promise<string> {
  if ("path" in server) {
    return getManifestFromFS(server.path)
  } else if ("url" in server) {
    return getManifestFromUrl(server.url)
  } else {
    throw new Error(`unexpected server config: ${JSON.stringify(server)}`)
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

async function getManifestFromFS(serverPath: string): Promise<string> {
  const file = await fs.readFile(serverPath)
  if (!file) throw new Error(`No manifest file found at ${serverPath}`)
  return file.toString()
}
