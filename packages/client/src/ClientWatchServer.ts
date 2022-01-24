import {
  addEventListener,
  DevEvent,
  DevEventEmitter,
  getDeclarationForVersion,
  parseAppDeclarationFileContent,
  WatchServerCommand,
} from "@samen/core"
import http from "http"
import path from "path"
import generateClient from "./generateClient"
import writeClientSource from "./writeClientSource"

export default class ClientWatchServer {
  private readonly server: http.Server
  private readonly command: WatchServerCommand
  private readonly eventEmitter: DevEventEmitter

  constructor(cmd: WatchServerCommand) {
    this.command = cmd
    this.eventEmitter = new DevEventEmitter()
    this.server = this.startHttpServer()
    addEventListener(cmd.server.url, this.serverEventHandler.bind(this))
  }

  private async serverEventHandler(event: DevEvent) {
    console.log("serverEventHandler", event)
    if (event.type === "SERVER_BUILD_MANIFEST_SUCCESS") {
      try {
        this.eventEmitter.emit({ type: "CLIENT_BUILD_START" })
        const dts = await this.getManifestSource()
        const { result: dclr, typeChecker } =
          parseAppDeclarationFileContent(dts)
        const declarationVersion = getDeclarationForVersion(dclr)
        const clientSource = generateClient(declarationVersion, typeChecker)
        await writeClientSource(
          path.join("node_modules", "@samen", "client", "generated"),
          clientSource,
        )
        this.eventEmitter.emit({ type: "CLIENT_BUILD_SUCCESS" })
      } catch (error) {
        this.eventEmitter.emit({ type: "CLIENT_BUILD_FAILED", error })
      }
    }
  }

  private startHttpServer(): http.Server {
    this.eventEmitter.emit({ type: "CLIENT_WATCH_INIT" })
    const server = http.createServer()
    server.on("request", this.requestHandler.bind(this))
    server.on("listening", () => {
      this.eventEmitter.emit({ type: "CLIENT_WATCH_READY" })
    })
    server.listen(this.command.port)
    return server
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

    res.statusCode = 404
    res.write(`{ "error": "Method not found" }`)
    res.end()
  }

  private async getManifestSource(): Promise<string> {
    const url = `${this.command.server.url}/manifest`

    return new Promise((resolve, reject) => {
      http.get(url, (res) => {
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
}
