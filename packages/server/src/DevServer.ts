import {
  DevEventEmitter,
  ensureDir,
  generateAppDeclarationFile,
  generateRPCProxy,
  parseAppDeclarationFileContent,
  ParsedSamenApp,
  parseSamenApp,
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
  private readonly eventEmitter: DevEventEmitter

  private routes: RPCRoutes = {}
  private currentClientCodeHash = ""
  private clients: http.ServerResponse[] = []

  constructor(cmd: ServeServerCommand) {
    this.command = cmd
    this.eventEmitter = new DevEventEmitter()
    this.program = this.startWatch()
    this.server = this.startHttpServer()
  }

  private get samenDirPath(): string {
    return path.join(this.command.projectPath, ".samen")
  }

  private get manifestPath(): string {
    return path.join(this.samenDirPath, "manifest.d.ts")
  }

  private startWatch(): WatchProgram {
    // Start code watch
    const program = new WatchProgram(this.command.projectPath)
    program.onCompileSucceeded(this.codeCompiled.bind(this))
    program.onError(this.codeErrored.bind(this))
    return program
  }

  private startHttpServer(): http.Server {
    this.eventEmitter.emit({ type: "SERVER_SERVE_INIT" })
    const server = http.createServer()
    server.on("request", this.requestHandler.bind(this))
    server.on("listening", () => {
      this.eventEmitter.emit({ type: "SERVER_SERVE_READY" })
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
    console.log("hallo?")
    let app: ParsedSamenApp
    try {
      this.eventEmitter.emit({ type: "SERVER_BUILD_MANIFEST_START" })
      app = parseSamenApp(samenSourceFile, typeChecker)
      const dts = generateAppDeclarationFile(app, typeChecker)
      await fs.mkdir(this.samenDirPath, { recursive: true })
      await fs.writeFile(this.manifestPath, dts)
      this.eventEmitter.emit({ type: "SERVER_BUILD_MANIFEST_SUCCESS" })
    } catch (error) {
      this.eventEmitter.emit({ type: "SERVER_BUILD_MANIFEST_FAILED", error })
      return
    }

    try {
      this.eventEmitter.emit({ type: "SERVER_BUILD_RPCS_START" })
      this.routes = generateRoutes(app, typeChecker)
      const serverSource = mapSamenAppAppToServerSource(app)
      generateRPCProxy(serverSource, typeChecker)
      this.eventEmitter.emit({ type: "SERVER_BUILD_RPCS_SUCCESS" })
    } catch (error) {
      this.eventEmitter.emit({ type: "SERVER_BUILD_RPCS_FAILED", error })
      return
    }
  }

  private codeErrored(diagnostics: readonly ts.Diagnostic[]) {
    // TODO: add event for this?
    // this.emit("update", {
    //   type: DevServerEventType.CodeErrored,
    //   diagnostics,
    // })
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

    this.eventEmitter.emit({ type: "SERVER_RPC_START", url: req.url })

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
            this.eventEmitter.emit({ type: "SERVER_RPC_SUCCESS" })
          } catch (e: any) {
            this.eventEmitter.emit({ type: "SERVER_RPC_FAILED", error: e })
            if (e?.errorCode === "INVALID_INPUT_ERROR") {
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
        console.log("HOI!", service.name, func.name)
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