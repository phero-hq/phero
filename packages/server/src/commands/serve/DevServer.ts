import {
  generateManifest,
  hasErrorCode,
  PheroApp,
  parsePheroApp,
  PortInUseError,
  RPCResult,
} from "@phero/core"
import { ServerCommandServe, ServerDevEventEmitter } from "@phero/dev"
import crypto from "crypto"
import { promises as fs } from "fs"
import http from "http"
import path from "path"
import ts from "typescript"
import generatePheroExecutionFile from "../../code-gen/generatePheroExecutionFile"
import WatchProgram from "./WatchProgram"

export interface PrintedClientCode {
  domainSource: string
  basePheroClientSource: string
  pheroClientSource: string
}

interface Headers {
  [header: string]: string | string[] | undefined
}

interface RPCRoutes {
  [name: string]: (request: {
    headers: Headers
    body: any
  }) => Promise<RPCResult<any>>
}

export default class DevServer {
  private readonly command: ServerCommandServe
  private readonly projectPath: string
  private readonly eventEmitter: ServerDevEventEmitter
  private routes: RPCRoutes = {}
  private requestIndex = 0

  constructor(command: ServerCommandServe, projectPath: string) {
    this.command = command
    this.projectPath = projectPath
    this.eventEmitter = new ServerDevEventEmitter()
  }

  public async start() {
    try {
      this.eventEmitter.emit({ type: "SERVE_INIT" })
      const server = await this.startHttpServer()
      this.eventEmitter.emit({ type: "SERVE_READY" })
      const program = this.startWatch()
    } catch (error) {
      if (hasErrorCode(error) && error.code === "EADDRINUSE") {
        throw new PortInUseError(this.command.port)
      } else {
        throw error
      }
    }
  }

  private get manifestPath(): string {
    return path.join(this.projectPath, "phero-manifest.d.ts")
  }

  // TODO should find the output path based on tsconfig
  private get pheroExecutionJS(): string {
    return path.join(this.projectPath, "dist", "phero-execution.js")
  }

  private startWatch(): WatchProgram {
    // Start code watch
    const program = new WatchProgram(
      this.projectPath,
      this.buildProjectStart.bind(this),
      this.buildProjectSuccess.bind(this),
      this.buildProjectFailed.bind(this),
    )
    program.start()
    return program
  }

  private startHttpServer(): Promise<http.Server> {
    return new Promise((resolve, reject) => {
      const server = http.createServer()
      server
        .on("request", this.requestHandler.bind(this))
        .on("listening", () => resolve(server))
        .on("error", (error) => reject(error))
        .listen(this.command.port)
    })
  }

  private buildProjectStart() {
    this.eventEmitter.emit({ type: "BUILD_PROJECT_START" })
  }

  private async buildProjectSuccess(prog: ts.Program): Promise<void> {
    this.eventEmitter.emit({ type: "BUILD_PROJECT_SUCCESS" })

    let app: PheroApp
    try {
      this.eventEmitter.emit({ type: "BUILD_MANIFEST_START" })
      app = parsePheroApp(prog)
      const { content: dts } = generateManifest(app, prog.getTypeChecker())
      await fs.writeFile(this.manifestPath, dts)
      this.eventEmitter.emit({ type: "BUILD_MANIFEST_SUCCESS" })
    } catch (error) {
      this.eventEmitter.emit({
        type: "BUILD_MANIFEST_FAILED",
        errorMessage:
          error instanceof Error
            ? `${error.message}\nIf you think this is a bug, please submit an issue here: https://github.com/phero-hq/phero/issues`
            : "Unknown error",
      })
      return
    }

    try {
      this.eventEmitter.emit({ type: "BUILD_RPCS_START" })
      this.routes = this.generateRoutes(app)
      const output = generatePheroExecutionFile(app)
      await fs.writeFile(this.pheroExecutionJS, output.js)
      this.clearRequireCache()
      this.eventEmitter.emit({ type: "BUILD_RPCS_SUCCESS" })
    } catch (error) {
      console.error("err", error)
      this.eventEmitter.emit({
        type: "BUILD_RPCS_FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      return
    }
  }

  private buildProjectFailed(errorMessage: string) {
    this.eventEmitter.emit({
      type: "BUILD_PROJECT_FAILED",
      errorMessage,
    })
  }

  private async requestHandler(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ) {
    if (!req.url) {
      throw new Error("No url in request")
    }

    this.requestIndex = this.requestIndex + 1
    const requestId = `${this.requestIndex}`

    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST")
    res.setHeader("Access-Control-Allow-Headers", "content-type")

    const startTime = Date.now()

    if (req.method === "OPTIONS") {
      res.statusCode = 200
      res.end()
      return
    }

    if (this.eventEmitter.shouldRegisterListener(req)) {
      return this.eventEmitter.registerListener(res)
    }

    if (req.method === "GET") {
      if (req.url === "/manifest") {
        res.statusCode = 200
        res.write(await fs.readFile(this.manifestPath, "utf-8"))
        res.end()
        return
      }
    }

    this.eventEmitter.emit({
      type: "RPC_START",
      url: req.url,
      requestId,
      dateTime: new Date().toISOString(),
    })

    if (req.method === "POST") {
      res.setHeader("Content-Type", "application/json")
      if (req.url) {
        const route = this.routes[req.url]
        if (route) {
          try {
            const { headers } = req
            const body = await readBody(req)
            const rpcResult = await route({ headers, body })

            res.statusCode = rpcResult.status

            if (rpcResult.status === 200) {
              if (rpcResult.result === undefined) {
                res.statusCode = 204
              } else {
                res.write(JSON.stringify(rpcResult.result))
              }
              this.eventEmitter.emit({
                type: "RPC_SUCCESS",
                url: req.url,
                ms: Date.now() - startTime,
                requestId,
                dateTime: new Date().toISOString(),
              })
            } else if (rpcResult.status === 400) {
              // Validation error(s)
              res.write(JSON.stringify({ errors: rpcResult.errors }, null, 4))
              this.eventEmitter.emit({
                type: "RPC_FAILED_VALIDATION_ERROR",
                url: req.url,
                ms: Date.now() - startTime,
                requestId,
                dateTime: new Date().toISOString(),
                // TODO lets send all data we have
                errors: rpcResult.errors.map((err) => {
                  return {
                    path: err.path ?? ".",
                    message: err.message,
                  }
                }),
                input: rpcResult.input,
              })
            } else if (rpcResult.status === 500) {
              // Error is thrown
              res.write(JSON.stringify({ error: rpcResult.error }))
              this.eventEmitter.emit({
                type: "RPC_FAILED_FUNCTION_ERROR",
                url: req.url,
                ms: Date.now() - startTime,
                requestId,
                dateTime: new Date().toISOString(),
                error: rpcResult.error,
              })
            } else {
              throw new Error("Unsupported http status")
            }
          } catch (e) {
            // Indicates a bug in Phero
            res.statusCode = 500
            res.write(
              JSON.stringify({
                errorMessage: e instanceof Error ? e.message : "Unknown error",
              }),
            )
            this.eventEmitter.emit({
              type: "RPC_FAILED_SERVER_ERROR",
              url: req.url,
              ms: Date.now() - startTime,
              requestId,
              dateTime: new Date().toISOString(),
              error: {
                message: e instanceof Error ? e.message : "Unknown error",
                stack: (e instanceof Error && e.stack) || "",
              },
            })
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
    this.eventEmitter.emit({
      type: "RPC_FAILED_NOT_FOUND_ERROR",
      url: req.url,
      ms: Date.now() - startTime,
      requestId,
      dateTime: new Date().toISOString(),
    })
  }

  private generateRoutes(app: PheroApp): RPCRoutes {
    const routes: RPCRoutes = {}
    for (const service of app.services) {
      for (const func of service.funcs) {
        routes[`/${service.name}/${func.name}`] = async (input: any) => {
          const api = require(this.pheroExecutionJS)
          return api[`rpc_executor_${service.name}__${func.name}`](input.body)
        }
      }
    }
    return routes
  }

  // TODO: Make this more exact?
  private clearRequireCache() {
    Object.keys(require.cache).forEach((key) => {
      delete require.cache[key]
    })
  }
}

function readBody(request: http.IncomingMessage): Promise<object> {
  return new Promise<object>((resolve, reject) => {
    const chunks: Buffer[] = []
    request
      .on("data", (chunk: Buffer) => {
        chunks.push(chunk)
      })
      .on("end", () => {
        const bodyString = Buffer.concat(chunks).toString()
        resolve(bodyString === "" ? {} : JSON.parse(bodyString))
      })
      .on("error", (err: Error) => {
        reject(err)
      })
  })
}

function computeClientCodeHash(clientCode: PrintedClientCode): string {
  return crypto
    .createHash("sha1")
    .update(JSON.stringify(clientCode))
    .digest("base64")
}
