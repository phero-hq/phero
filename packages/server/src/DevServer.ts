import {
  generateAppDeclarationFile,
  generateRPCProxy,
  ParsedSamenApp,
  parseSamenApp,
  ServerDevEventEmitter,
  ServeServerCommand,
} from "@samen/core"
import crypto from "crypto"
import { promises as fs } from "fs"
import http from "http"
import path from "path"
import ts from "typescript"
import { mapSamenAppAppToServerSource } from "./mapSamenAppAppToServerSource"
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

export default class DevServer {
  private readonly server: http.Server
  private readonly program: WatchProgram
  private readonly command: ServeServerCommand
  private readonly projectPath: string
  private readonly eventEmitter: ServerDevEventEmitter

  private routes: RPCRoutes = {}
  private currentClientCodeHash = ""
  private clients: http.ServerResponse[] = []

  constructor(command: ServeServerCommand, projectPath: string) {
    this.command = command
    this.projectPath = projectPath
    this.eventEmitter = new ServerDevEventEmitter()
    this.server = this.startHttpServer()
    this.program = this.startWatch()
  }

  private get manifestPath(): string {
    return path.join(this.projectPath, "samen-manifest.d.ts")
  }

  private startWatch(): WatchProgram {
    // Start code watch
    this.eventEmitter.emit({ type: "BUILD_PROJECT_START" })
    const program = new WatchProgram(this.projectPath)
    program.onCompileSucceeded(this.codeCompiled.bind(this))
    program.onError(this.codeErrored.bind(this))
    return program
  }

  private startHttpServer(): http.Server {
    this.eventEmitter.emit({ type: "SERVE_INIT" })
    const server = http.createServer()
    server.on("request", this.requestHandler.bind(this))
    server.on("listening", () => {
      this.eventEmitter.emit({ type: "SERVE_READY" })
    })
    server.listen(this.command.port)
    return server
  }

  private baseSamenClientSource?: string
  private async readBaseSamenClientSource(): Promise<string> {
    if (!this.baseSamenClientSource) {
      this.baseSamenClientSource = await fs.readFile(
        path.join(__dirname, "../../src/BaseSamenClient.ts"),
        { encoding: "utf-8" },
      )
    }
    return this.baseSamenClientSource
  }

  private async codeCompiled(
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
        error: JSON.stringify(error),
      })
      return
    }

    try {
      this.eventEmitter.emit({ type: "BUILD_RPCS_START" })
      this.routes = generateRoutes(app, typeChecker)
      const serverSource = mapSamenAppAppToServerSource(app)
      generateRPCProxy(serverSource, typeChecker)
      this.eventEmitter.emit({ type: "BUILD_RPCS_SUCCESS" })
    } catch (error) {
      this.eventEmitter.emit({
        type: "BUILD_RPCS_FAILED",
        error: JSON.stringify(error),
      })
      return
    }
  }

  private codeErrored(diagnostics: readonly ts.Diagnostic[]) {
    this.eventEmitter.emit({ type: "BUILD_PROJECT_FAILED", error: "TODO" })
  }

  private async requestHandler(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST")
    res.setHeader("Access-Control-Allow-Headers", "content-type, authorization")

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
            const responseData = await route({ headers, body })
            if (responseData === undefined) {
              res.statusCode = 204
            } else {
              res.statusCode = 200
              res.write(JSON.stringify(responseData))
            }
            this.eventEmitter.emit({
              type: "RPC_SUCCESS",
              url: req.url,
              status: res.statusCode,
            })
          } catch (e: any) {
            if (e?.errorCode === "INVALID_INPUT_ERROR") {
              res.statusCode = 400
              console.error(e)
              res.write(JSON.stringify({ error: e.message, errors: e.errors }))
              this.eventEmitter.emit({
                type: "RPC_FAILED",
                url: req.url,
                status: 400,
              })
            } else if (e.errorCode === "AUTHORIZATION_ERROR") {
              res.statusCode = 401
              console.error(e)
              res.write(JSON.stringify({ error: e.message }))
              this.eventEmitter.emit({
                type: "RPC_FAILED",
                url: req.url,
                status: 401,
              })
            } else {
              res.statusCode = 500
              console.error(e)
              res.write(JSON.stringify({ error: e.message }))
              this.eventEmitter.emit({
                type: "RPC_FAILED",
                url: req.url,
                status: 500,
              })
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

// TODO: Make this more exact?
// function clearRequireCache() {
//   Object.keys(require.cache).forEach((key) => {
//     delete require.cache[key]
//   })
// }

function generateRoutes(
  app: ParsedSamenApp,
  typeChecker: ts.TypeChecker,
): RPCRoutes {
  const routes: RPCRoutes = {}
  for (const service of app.services) {
    for (const func of service.funcs) {
      routes[`/${service.name}/${func.name}`] = async () => {
        // console.log("HOI!", service.name, func.name)
      }
    }
  }
  return routes
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
