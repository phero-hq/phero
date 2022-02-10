import {
  addDevEventListener,
  ClientDevEventEmitter,
  DevEventListenerConnectionStatus,
  ServerDevEvent,
  WatchServerCommand,
} from "@samen/cli-lib"
import http from "http"
import buildClient from "./utils/buildClient"

export default class ClientWatchServer {
  private readonly server: http.Server
  private readonly command: WatchServerCommand
  private readonly eventEmitter: ClientDevEventEmitter

  constructor(command: WatchServerCommand) {
    this.command = command
    this.eventEmitter = new ClientDevEventEmitter()

    addDevEventListener(
      this.command.server.url,
      this.onServerEvent.bind(this),
      this.onChangeServerEventConnectionStatus.bind(this),
    )

    this.server = this.startHttpServer()
  }

  private async onServerEvent(event: ServerDevEvent) {
    switch (event.type) {
      case "BUILD_MANIFEST_SUCCESS":
        await this.buildClient()
        break
    }
  }

  private async onChangeServerEventConnectionStatus(
    status: DevEventListenerConnectionStatus,
  ) {
    switch (status) {
      case "CONNECTED":
        await this.buildClient()
        this.eventEmitter.emit({ type: "SERVER_CONNECTED" })
        break

      case "DISCONNECTED":
        this.eventEmitter.emit({ type: "SERVER_DISCONNECTED" })
        break

      case "EMITTER_NOT_FOUND":
        this.eventEmitter.emit({ type: "SERVER_NOT_FOUND" })
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
