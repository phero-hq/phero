import { hasErrorCode, PortInUseError } from "@samen/core"
import {
  addDevEventListener,
  ClientCommandWatch,
  ClientDevEventEmitter,
  ServerDevEvent,
} from "@samen/dev"
import http from "http"
import buildClient from "./utils/buildClient"

export default class ClientWatchServer {
  private readonly server: http.Server
  private readonly command: ClientCommandWatch
  private readonly eventEmitter: ClientDevEventEmitter
  private eventEmitterHasBeenConnectedOnce = false

  constructor(command: ClientCommandWatch) {
    this.command = command
    this.eventEmitter = new ClientDevEventEmitter()

    addDevEventListener(
      this.command.server.url,
      this.onServerEvent.bind(this),
      this.onServerEventEmitterOpen.bind(this),
      this.onServerEventEmitterError.bind(this),
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

  private async onServerEventEmitterOpen() {
    this.eventEmitterHasBeenConnectedOnce = true
    this.eventEmitter.emit({ type: "SERVER_CONNECTED" })
    await this.buildClient()
  }

  private onServerEventEmitterError(errorMessage: string) {
    if (this.eventEmitterHasBeenConnectedOnce) {
      this.eventEmitter.emit({ type: "SERVER_DISCONNECTED", errorMessage })
    } else {
      this.eventEmitter.emit({ type: "SERVER_NOT_FOUND", errorMessage })
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
        errorMessage: error instanceof Error ? error.message : "unknown",
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
    server.on("error", (error) => {
      if (hasErrorCode(error) && error.code === "EADDRINUSE") {
        throw new PortInUseError(this.command.port)
      } else {
        throw error
      }
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
    res.setHeader("Access-Control-Allow-Headers", "content-type")

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
