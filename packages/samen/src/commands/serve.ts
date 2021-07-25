import {
  ClientEvent,
  Environment,
  handleError,
  paths,
  readConfigFile,
  readManifestFile,
  RPCFunction,
  SamenManifest,
  startSpinner,
} from "@samen/core"
import http from "http"
import path from "path"
import TscWatchClient from "tsc-watch/client"
import { buildManifest, buildRPCFunctions } from "./build"

const PORT = parseInt(process.env.PORT || "") || 4000

const SSE_RESPONSE_HEADER = {
  Connection: "keep-alive",
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "X-Accel-Buffering": "no",
}

interface RPCRoute {
  definition: RPCFunction
  importedFunction: any // TODO
  argumentNames: string[]
}
type RPCRoutes = Record<string, RPCRoute>
let rpcRoutes: RPCRoutes = {}
let environment: Environment
let manifest: SamenManifest
let manifestHash: string
let manifestPath: string
let clients: http.ServerResponse[] = []

export default async function serve(
  _environment: Environment,
  _manifestPath: string,
) {
  environment = _environment
  manifestPath = _manifestPath

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
    const result = await buildManifest(manifestPath)
    manifest = result.manifest
    if (manifestHash !== result.hash) {
      manifestHash = result.hash
      notifyClients(ClientEvent.ManifestDidCHange, clients)
    }
    const config = await readConfigFile()
    await buildRPCFunctions(manifest, result.samenFilePath, config, false)
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
  if (!manifest) manifest = await readManifestFile(manifestPath)
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

    if (req.method === "OPTIONS") {
      res.statusCode = 200
      res.end()
      return
    }

    if (req.headers.accept?.includes("text/event-stream")) {
      registerClient(req, res)
      return notifyClients(ClientEvent.ClientDidRegister, [res])
    }

    console.log("REQUEST", req.method, req.url)

    if (req.method === "GET") {
      if (req.url === "/manifest.json") {
        if (environment === Environment.development) {
          res.setHeader("Content-Type", "application/json")
          res.statusCode = 200
          res.write(JSON.stringify(manifest))
          res.end()
          return
        } else {
          res.statusCode = 404
          res.end()
          return
        }
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

function notifyClients(event: ClientEvent, clients: http.ServerResponse[]) {
  if (!clients.length) return

  let spinner
  if (event === ClientEvent.ManifestDidCHange) {
    spinner = startSpinner(
      `Notifying ${
        clients.length === 1 ? "client" : `${clients.length} clients`
      }`,
    )
  }

  clients.forEach((connection) => {
    const id = new Date().toISOString()
    connection.write("id: " + id + "\n")
    connection.write("retry: 2000\n")
    connection.write("data: " + event + "\n\n")
  })

  if (spinner) {
    spinner.succeed(
      `Notified ${
        clients.length === 1 ? "client" : `${clients.length} clients`
      }`,
    )
  }
}

function registerClient(req: http.IncomingMessage, res: http.ServerResponse) {
  const spinner = startSpinner("Connecting client")
  clients.push(res)
  res.on("close", () => unregisterClient(res))
  res.writeHead(200, SSE_RESPONSE_HEADER)
  spinner.succeed(
    clients.length === 1
      ? "Client connected"
      : `${clients.length} clients connected`,
  )
}

function unregisterClient(res: http.ServerResponse) {
  const spinner = startSpinner("Disconnecting client")
  clients = clients.filter((client) => client !== res)
  spinner.succeed("Client disconnected")
}
