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

const PORT = parseInt(process.env.PORT || "") || 4000

interface RPCRoute {
  definition: RPCFunction
  importedFunction: any // TODO
  argumentNames: string[]
}
type RPCRoutes = Record<string, RPCRoute>
let rpcRoutes: RPCRoutes = {}
let environment: Environment
let manifest: SamenManifest

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
  } else {
    await loadRoutes()
  }
}

async function reload(): Promise<void> {
  try {
    await build(environment)
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
  clearRequireCache()
  manifest = await readManifestFile()
  rpcRoutes = getRPCRoutes(manifest)
  spinner.succeed("Loaded routes")
}

function getRPCRoutes(manifest: SamenManifest): RPCRoutes {
  return manifest.rpcFunctions.reduce((routes, rpcFunction) => {
    const makeRpcPath = (joinWith = ".") =>
      rpcFunction.namespace.length
        ? `${rpcFunction.namespace.join(joinWith)}${joinWith}${
            rpcFunction.name
          }`
        : rpcFunction.name

    return {
      ...routes,
      [`/${makeRpcPath("/")}`]: {
        definition: rpcFunction,
        importedFunction: require(path.join(
          paths.userRpcFunctionsDir,
          makeRpcPath(),
        ))[`serveHandler`],
        argumentNames: rpcFunction.parameters
          .sort((a, b) => a.index - b.index)
          .map((r) => r.name),
      },
    }
  }, {} as RPCRoutes)
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

    if (req.method === "GET") {
      if (req.url === "/manifest.json") {
        res.setHeader("Content-Type", "application/json")
        res.statusCode = 200
        res.write(JSON.stringify(manifest))
        res.end()
        return
      }
    }

    if (req.method === "POST") {
      res.setHeader("Content-Type", "application/json")

      if (req.url) {
        const route = rpcRoutes[req.url]
        if (route) {
          try {
            const { headers } = req
            const bodyString = await readBody(req)
            const body = bodyString === "" ? {} : JSON.parse(bodyString)
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
