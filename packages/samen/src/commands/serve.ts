import http from "http"
import path from "path"
import TscWatchClient from "tsc-watch/client"
import {
  handleError,
  paths,
  RPCFunction,
  SamenManifest,
  Environment,
  startSpinner,
  readManifestFile,
} from "@samen/core"
import build from "./build"
import buildClients from "./buildClients"

const PORT = parseInt(process.env.PORT || "") || 4000

interface Route {
  definition: RPCFunction
  importedFunction: any // TODO
  argumentNames: string[]
}
type Routes = Record<string, Route>
let routes: Routes = {}
let environment: Environment

export default async function serve(_environment: Environment) {
  environment = _environment

  const server = http.createServer()
  server.on("request", requestListener())
  server.on("listening", () => {
    console.log(`Samen is listening on port ${PORT}`)
  })
  server.listen(PORT)

  if (environment === Environment.development) {
    const watch = new TscWatchClient()
    watch.on("success", reload)
    watch.start("--project", paths.userProjectDir)
  }
}

async function reload(): Promise<void> {
  try {
    await build(environment)
    await buildClients(environment)
    await loadRoutes()
    startSpinner("").succeed(`Samen is served at http://localhost:${PORT}`)
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

async function loadRoutes(): Promise<void> {
  const spinner = startSpinner("Updating routes")
  const manifest = await readManifestFile()
  clearRequireCache()
  routes = getRoutes(manifest)
  spinner.succeed("Loaded routes")
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
        ))[`serveHandler`],
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
    res.setHeader("Access-Control-Allow-Headers", "content-type, authorization")

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
            const { headers } = req
            const body = await readBody(req)
            const responseData = await route.importedFunction({ headers, body })
            if (responseData === undefined) {
              res.statusCode = 204
            } else {
              res.statusCode = 200
              res.write(JSON.stringify(responseData))
            }
          } catch (e) {
            if (e.errorCode === "INVALID_INPUT_ERROR") {
              res.statusCode = 400
              console.error(e)
              res.write(JSON.stringify({ error: e.message, errors: e.errors }))
            } else if (e.errorCode === "AUTHORIZATION_ERROR") {
              res.statusCode = 401
              console.error(e)
              res.write(JSON.stringify({ error: e.message }))
            } else {
              res.statusCode = 500
              console.error(e)
              res.write(JSON.stringify({ error: e.message }))
            }
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
