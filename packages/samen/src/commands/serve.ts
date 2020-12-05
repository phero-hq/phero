import { promises as fs } from "fs"
import http from "http"
import path from "path"
import TscWatchClient from "tsc-watch/client"
import { handleError, paths, RPCFunction, SamenManifest } from "@samen/core"
import build from "./build"
import buildClients from "./buildClients"

const PORT = parseInt(process.env.PORT || "") || 4000
const IS_PROD = process.env.NODE_ENV === "production"

interface Route {
  definition: RPCFunction
  importedFunction: any // TODO
  argumentNames: string[]
}
type Routes = Record<string, Route>
let routes: Routes = {}

export default async function serve() {
  const server = http.createServer()
  server.on("request", requestListener())
  server.on("listening", () => {
    console.log(`Samen is listening on port ${PORT}`)
  })
  server.listen(PORT)

  if (IS_PROD) {
    await reload()
  } else {
    const watch = new TscWatchClient()
    watch.on("success", reload)
    watch.start("--project", paths.userProjectDir)
  }
}

async function reload(): Promise<void> {
  try {
    await build()

    console.log("Updating routes...")
    const manifest = await getManifest()
    clearRequireCache()
    routes = getRoutes(manifest)

    await buildClients()

    console.log("Samen is ready")
  } catch (error) {
    // TODO: Stay alive
    handleError(error)
  }
}

// TODO: Make this more exact?
function clearRequireCache() {
  Object.keys(require.cache).forEach((key) => {
    delete require.cache[key]
  })
}

async function getManifest(): Promise<SamenManifest> {
  const manifestPath = paths.userManifestFile
  const manifestFile = await fs.readFile(manifestPath)

  if (!manifestFile) {
    throw new Error(`Manifest file not found at ${manifestPath}`)
  }

  const manifest = JSON.parse(manifestFile.toString())
  return (manifest as unknown) as SamenManifest
}

function getRoutes(manifest: SamenManifest): Routes {
  return manifest.rpcFunctions.reduce((routes, rpcFunction) => {
    return {
      ...routes,
      [`/${rpcFunction.name}`]: {
        definition: rpcFunction,
        importedFunction: require(path.join(
          paths.userRpcFunctionsDir,
          rpcFunction.name,
        ))[`rpc_${rpcFunction.name}`],
        argumentNames: rpcFunction.parameters
          .sort((a, b) => a.index - b.index)
          .map((r) => r.name),
      },
    }
  }, {} as Routes)
}

function requestListener() {
  return async (req: http.IncomingMessage, res: http.ServerResponse) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST")
    res.setHeader("Access-Control-Allow-Headers", "content-type")

    console.log("REQUEST", req.method, req.url)
    if (req.method === "OPTIONS") {
      res.statusCode = 200
      res.end()
      return
    }

    if (req.method === "POST") {
      res.setHeader("Content-Type", "application/json")

      if (req.url) {
        const route = routes[req.url]
        if (route) {
          try {
            const body = await readBody(req)
            const parameters = buildParameters(route, body)
            const responseData = await route.importedFunction(...parameters)
            if (responseData === undefined) {
              res.statusCode = 204
            } else {
              res.statusCode = 200
              res.write(JSON.stringify(responseData))
            }
          } catch (e) {
            res.statusCode = 500
            console.error(e)
            res.write(JSON.stringify({ error: e.message }))
          } finally {
            res.end()
            return
          }
        }
      }
    }

    res.statusCode = 404
    res.write(`{ "error": "RPC not found" }`)
    res.end()
  }
}

function buildParameters(route: Route, body?: string): unknown[] {
  if (!body) return []
  const parsedBody = JSON.parse(body)
  return route.argumentNames.map((argumentName) => parsedBody[argumentName])
}

function readBody(request: http.IncomingMessage): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    request
      .on("data", (chunk: Buffer) => {
        chunks.push(chunk)
      })
      .on("end", () => {
        resolve(Buffer.concat(chunks).toString())
      })
      .on("error", (err: Error) => {
        reject(err)
      })
  })
}
