import { ServerDevEventEmitter, ServerCommandServe } from "@samen/dev"
import {
  generateAppDeclarationFile,
  generateRPCProxy,
  ParsedSamenApp,
  parseSamenApp,
  PortInUseError,
} from "@samen/core"
import crypto from "crypto"
import { promises as fs } from "fs"
import http from "http"
import path, { resolve } from "path"
import ts from "typescript"
import WatchProgram from "./WatchProgram"

export interface PrintedClientCode {
  domainSource: string
  baseSamenClientSource: string
  samenClientSource: string
}

interface Headers {
  [header: string]: string | string[] | undefined
}

interface RPCRoutes {
  [name: string]: (request: { headers: Headers; body: any }) => Promise<any>
}

function hasErrorCode(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as any).code === "string"
  )
}

export default class DevServer {
  private readonly command: ServerCommandServe
  private readonly projectPath: string
  private readonly eventEmitter: ServerDevEventEmitter
  private routes: RPCRoutes = {}

  constructor(command: ServerCommandServe, projectPath: string) {
    this.command = command
    this.projectPath = projectPath
    this.eventEmitter = new ServerDevEventEmitter()
  }

  public async start() {
    const server = await this.startHttpServer()
    const program = this.startWatch()
  }

  private get manifestPath(): string {
    return path.join(this.projectPath, "samen-manifest.d.ts")
  }

  // TODO should find the output path based on tsconfig
  private get samenExecutionJS(): string {
    return path.join(this.projectPath, "dist", "samen-execution.js")
  }

  private startWatch(): WatchProgram {
    // Start code watch
    const program = new WatchProgram(
      this.projectPath,
      this.buildProjectSuccess.bind(this),
      this.buildProjectFailed.bind(this),
    )
    program.start()
    return program
  }

  private startHttpServer(): Promise<http.Server> {
    return new Promise((resolve, reject) => {
      this.eventEmitter.emit({ type: "SERVE_INIT" })
      const server = http.createServer()

      server.on("request", this.requestHandler.bind(this))

      server.on("listening", () => {
        resolve(server)
        this.eventEmitter.emit({ type: "SERVE_READY" })
      })

      server.on("error", (error) => {
        if (hasErrorCode(error) && error.code === "EADDRINUSE") {
          reject(new PortInUseError(this.command.port))
        } else {
          reject(error)
        }
      })

      server.listen(this.command.port)
    })
  }

  private async buildProjectSuccess(
    samenSourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker,
  ): Promise<void> {
    this.eventEmitter.emit({ type: "BUILD_PROJECT_SUCCESS" })

    let app: ParsedSamenApp
    try {
      this.eventEmitter.emit({ type: "BUILD_MANIFEST_START" })
      app = parseSamenApp(samenSourceFile, typeChecker)
      const dts = generateAppDeclarationFile(app, typeChecker)
      await fs.writeFile(this.manifestPath, dts)
      this.eventEmitter.emit({ type: "BUILD_MANIFEST_SUCCESS" })
    } catch (error) {
      this.eventEmitter.emit({
        type: "BUILD_MANIFEST_FAILED",
        errorMessage: error instanceof Error ? error.message : "unknown error",
      })
      return
    }

    try {
      this.eventEmitter.emit({ type: "BUILD_RPCS_START" })
      this.routes = this.generateRoutes(app)
      const output = generateRPCProxy(app, typeChecker)
      await fs.writeFile(this.samenExecutionJS, output.js)
      this.clearRequireCache()

      this.eventEmitter.emit({ type: "BUILD_RPCS_SUCCESS" })
    } catch (error) {
      this.eventEmitter.emit({
        type: "BUILD_RPCS_FAILED",
        errorMessage: error instanceof Error ? error.message : "unknown error",
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
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST")
    res.setHeader("Access-Control-Allow-Headers", "content-type, authorization")

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

    this.eventEmitter.emit({ type: "RPC_START", url: req.url })

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
              res.write(JSON.stringify(rpcResult.result))
              this.eventEmitter.emit({
                type: "RPC_SUCCESS",
                url: req.url,
                status: res.statusCode,
                ms: Date.now() - startTime,
              })
            } else if (rpcResult.status === 400) {
              res.write(JSON.stringify(rpcResult.errors, null, 4))
              this.eventEmitter.emit({
                type: "RPC_FAILED",
                url: req.url,
                status: res.statusCode,
                errorMessage: JSON.stringify(rpcResult.errors),
                ms: Date.now() - startTime,
              })
            } else if (rpcResult.status === 500) {
              res.write(JSON.stringify(rpcResult.error))
              this.eventEmitter.emit({
                type: "RPC_FAILED",
                url: req.url,
                status: res.statusCode,
                errorMessage: rpcResult.error,
                ms: Date.now() - startTime,
              })
            } else {
              throw new Error("Unsupported http status")
            }
          } catch (e) {
            // Indicates a bug in Samen
            const errorMessage =
              e instanceof Error ? e.message : "unknown error"
            res.statusCode = 500
            res.write(JSON.stringify({ errorMessage }))
            this.eventEmitter.emit({
              type: "RPC_FAILED",
              url: req.url,
              status: 500,
              errorMessage,
              ms: Date.now() - startTime,
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
      type: "RPC_FAILED",
      url: req.url,
      status: 404,
      errorMessage: "RPC not found",
      ms: Date.now() - startTime,
    })
  }

  private generateRoutes(app: ParsedSamenApp): RPCRoutes {
    const routes: RPCRoutes = {}
    for (const service of app.services) {
      for (const func of service.funcs) {
        routes[`/${service.name}/${func.name}`] = async (input: any) => {
          const api = require(this.samenExecutionJS)
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
