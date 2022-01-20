import EventEmitter from "events"
import http from "http"
import crypto from "crypto"
import path from "path"
import { promises as fs } from "fs"
import ts from "typescript"
import generateClient, {
  mapParsedAppDeclarationToServerSource,
  mapSamenAppAppToServerSource,
} from "../generateClient"
import parseSamenApp, { ParsedSamenApp } from "../parseSamenApp"
import WatchProgram from "../WatchProgram"
import { printSourceFile } from "../writeClientSource"
import generateAppDeclarationFile from "../generateAppDeclarationFile"
import { parseAppDeclarationFileContent } from "../parseAppDeclaration"
import generateModelParser from "../code-gen/parsers/generateParser"
import { printCode } from "../tsTestUtils"
import generateRPCProxy from "../code-gen/generateRPCProxy"

export enum DevServerEventType {
  ClientConnecting = "clientConnecting",
  ClientConnected = "clientConnected",
  ClientRegistered = "clientRegistered",
  ClientDisconnecting = "clientDisconnecting",
  ClientDisconnected = "clientDisconnected",
  ServerStarting = "serverStarting",
  ServerStarted = "serverStarted",
  CodeReloading = "codeReloading",
  CodeReloaded = "codeReloaded",
  CodeErrored = "codeErrored",
}

export type DevServerEvent =
  | {
      type:
        | DevServerEventType.ClientConnecting
        | DevServerEventType.ClientDisconnecting
        | DevServerEventType.ServerStarting
        | DevServerEventType.CodeReloading
        | DevServerEventType.ClientRegistered
    }
  | {
      type:
        | DevServerEventType.ClientConnected
        | DevServerEventType.ClientDisconnected
      clients: number
    }
  | {
      type: DevServerEventType.ServerStarted
      opts: ServerOpts
    }
  | {
      type: DevServerEventType.CodeReloaded
      source: PrintedClientCode
    }
  | {
      type: DevServerEventType.CodeErrored
      diagnostics: ts.Diagnostic[]
    }

export interface ServerOpts {
  projectPath: string
  port?: number
}

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

const DEFAULT_PORT = 4321

export default class DevServer extends EventEmitter {
  private readonly server: http.Server
  private readonly program: WatchProgram
  private readonly opts: ServerOpts & { port: number }

  private routes: RPCRoutes = {}
  private currentClientCodeHash = ""
  private clients: http.ServerResponse[] = []

  constructor(opts: ServerOpts) {
    super({
      captureRejections: true,
    })
    this.opts = {
      ...opts,
      port: opts.port ?? DEFAULT_PORT,
    }
    this.program = this.startWatch()
    this.server = this.startHttpServer()
  }

  private startWatch(): WatchProgram {
    // Start code watch
    const program = new WatchProgram(this.opts.projectPath)
    program.onCompileSucceeded(this.codeCompiled.bind(this))
    program.onError(this.codeErrored.bind(this))
    return program
  }

  private startHttpServer(): http.Server {
    this.emit("update", { type: DevServerEventType.ServerStarting })
    const server = http.createServer()
    server.on("request", this.requestHandler.bind(this))
    server.on("listening", () => {
      this.emit("update", {
        type: DevServerEventType.ServerStarted,
        opts: this.opts,
      })
    })
    server.listen(this.opts.port)
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
    this.emit("update", { type: DevServerEventType.CodeReloading })

    const app = parseSamenApp(samenSourceFile, typeChecker)

    this.routes = generateRoutes(app, typeChecker)
    const serverSource = mapSamenAppAppToServerSource(app)
    generateRPCProxy(serverSource, typeChecker)

    // TODO optimize this
    // const clientSource = generateClient(
    //   mapSamenAppAppToServerSource(app),
    //   typeChecker,
    // )
    // const dts = generateAppDeclarationFile(app, typeChecker)
    // const dclr = parseAppDeclarationFileContent(dts)
    // const clientSource = generateClient(
    //   mapParsedAppDeclarationToServerSource(dclr),
    //   typeChecker,
    // )

    // const printedClientSource: PrintedClientCode = {
    //   domainSource: printSourceFile(clientSource.domainSource),
    //   samenClientSource: printSourceFile(clientSource.samenClientSource),
    //   baseSamenClientSource: await this.readBaseSamenClientSource(),
    // }

    // const hash = computeClientCodeHash(printedClientSource)
    // if (this.currentClientCodeHash !== hash) {
    //   this.notifyClients(
    //     {
    //       type: DevServerEventType.CodeReloaded,
    //       source: printedClientSource,
    //     },
    //     this.clients,
    //   )
    //   this.currentClientCodeHash = hash
    // }

    // this.emit("update", {
    //   type: DevServerEventType.CodeReloaded,
    //   printedClientSource,
    // })
  }

  private codeErrored(diagnostics: readonly ts.Diagnostic[]) {
    this.emit("update", {
      type: DevServerEventType.CodeErrored,
      diagnostics,
    })
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

    if (req.headers.accept?.includes("text/event-stream")) {
      this.registerClient(res)
      this.notifyClients({ type: DevServerEventType.ClientRegistered }, [res])
      return
    }

    console.log("REQUEST", req.method, req.url)

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
          } catch (e: any) {
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

  private registerClient(res: http.ServerResponse): void {
    this.emit("update", { type: DevServerEventType.ClientConnecting })
    this.clients.push(res)
    res.on("close", () => this.unregisterClient(res))
    res.writeHead(200, {
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    })
    this.emit("update", {
      type: DevServerEventType.ClientConnected,
      clients: this.clients.length,
    })
  }

  private unregisterClient(res: http.ServerResponse): void {
    this.emit("update", { type: DevServerEventType.ClientDisconnecting })
    this.clients = this.clients.filter((client) => client !== res)
    this.emit("update", {
      type: DevServerEventType.ClientDisconnected,
      clients: this.clients.length,
    })
  }

  private notifyClients(
    event: DevServerEvent,
    clients: http.ServerResponse[],
  ): void {
    if (!clients.length) return

    clients.forEach((connection) => {
      const id = new Date().toISOString()
      connection.write("id: " + id + "\n")
      connection.write("retry: 2000\n")
      connection.write("data: " + JSON.stringify(event) + "\n\n")
    })
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
