import { BuildClientCommand, ClientCommand } from "@samen/dev"
import {
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
    path.join("src", "samen"),
    clientSource,
  )
}

async function getManifestSource(
  server: BuildClientCommand["server"],
): Promise<string> {
  if ("path" in server) {
    return getManifestFromPath(server.path)
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

async function getManifestFromPath(serverPath: string): Promise<string> {
  const path = `${serverPath}/samen-manifest.d.ts`

  try {
    await fs.access(path)
  } catch (error) {
    throw new Error(`No manifest file found at ${path}`)
  }

  return (await fs.readFile(path)).toString()
}
