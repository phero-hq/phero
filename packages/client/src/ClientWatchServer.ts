import {
  addServerDevEventListener,
  ClientDevEventEmitter,
  ServerDevEvent,
  WatchServerCommand,
} from "@samen/core"
import http from "http"
import buildClient from "./utils/buildClient"

export default class ClientWatchServer {
  private readonly server: http.Server
  private readonly command: WatchServerCommand
  private readonly eventEmitter: ClientDevEventEmitter

  constructor(command: WatchServerCommand) {
    this.command = command
    addServerDevEventListener(
      this.command.server.url,
      this.serverEventHandler.bind(this),
    )

    this.eventEmitter = new ClientDevEventEmitter()
    this.server = this.startHttpServer()
  }

  private async serverEventHandler(event: ServerDevEvent) {
    switch (event.type) {
      case "SERVER_CONNECTED":
        this.eventEmitter.emit(event)
        await this.buildClient()
        break

      case "SERVER_DISCONNECTED":
      case "SERVER_NOT_FOUND":
        this.eventEmitter.emit(event)
        break

      case "BUILD_MANIFEST_SUCCESS":
        this.buildClient()
        break
    }
  }

  private async buildClient(): Promise<void> {
    try {
      this.eventEmitter.emit({ type: "BUILD_START" })
      await buildClient(this.command.server)
      this.eventEmitter.emit({ type: "BUILD_SUCCESS" })
    } catch (error) {
      this.eventEmitter.emit({
        type: "BUILD_FAILED",
        error: JSON.stringify(error),
      })
    }
  }

  private startHttpServer(): http.Server {
    this.eventEmitter.emit({ type: "WATCH_INIT" })
    const server = http.createServer()
    server.on("request", this.requestHandler.bind(this))
    server.on("listening", () => {
      this.eventEmitter.emit({ type: "WATCH_READY" })
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
}
