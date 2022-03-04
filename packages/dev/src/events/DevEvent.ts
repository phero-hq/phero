import http, { Server } from "http"
import EventSource from "eventsource"

const SSE_RESPONSE_HEADER = {
  Connection: "keep-alive",
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "X-Accel-Buffering": "no",
}

type DevEventEmitterConnectionEvent =
  | { type: "LISTENER_CONNECTED"; id: string }
  | { type: "LISTENER_DISCONNECTED"; id: string }

export type DevEventListenerConnectionStatus =
  | "CONNECTED"
  | "DISCONNECTED"
  | "EMITTER_NOT_FOUND"

export type ServerDevEvent =
  | DevEventEmitterConnectionEvent

  // Init
  | { type: "SERVE_INIT" }
  | { type: "SERVE_READY" }

  // Building the project
  | { type: "BUILD_PROJECT_START" }
  | { type: "BUILD_PROJECT_SUCCESS" }
  | { type: "BUILD_PROJECT_FAILED"; error: string }

  // Building the manifest file
  | { type: "BUILD_MANIFEST_START" }
  | { type: "BUILD_MANIFEST_SUCCESS" }
  | { type: "BUILD_MANIFEST_FAILED"; error: string }

  // Building the RPC's
  | { type: "BUILD_RPCS_START" }
  | { type: "BUILD_RPCS_SUCCESS" }
  | { type: "BUILD_RPCS_FAILED"; error: string }

  // Running the RPC's
  | { type: "RPC_START"; url?: string }
  | { type: "RPC_SUCCESS"; url?: string; status: number }
  | { type: "RPC_FAILED"; url?: string; status: number }

export type ClientDevEvent =
  | DevEventEmitterConnectionEvent

  // Watch init
  | { type: "WATCH_INIT" }
  | { type: "WATCH_READY" }

  // Connecting to a server's emitter
  | { type: "SERVER_CONNECTED" }
  | { type: "SERVER_DISCONNECTED" }
  | { type: "SERVER_NOT_FOUND" }

  // Building the client
  | { type: "BUILD_START" }
  | { type: "BUILD_SUCCESS" }
  | { type: "BUILD_FAILED"; error: string }

// Event emitters

class DevEventEmitter<T extends ServerDevEvent | ClientDevEvent> {
  public listeners: http.ServerResponse[] = []

  public shouldRegisterListener(req: http.IncomingMessage): boolean {
    return !!req.headers.accept?.includes("text/event-stream")
  }

  public registerListener(res: http.ServerResponse) {
    const id = new Date().toISOString()
    const connectedEvent: DevEventEmitterConnectionEvent = {
      type: "LISTENER_CONNECTED",
      id,
    }

    this.listeners.push(res)
    res.on("close", () => {
      this.listeners = this.listeners.filter((listener) => listener !== res)
      this.emit({ type: "LISTENER_DISCONNECTED", id })
    })
    res.writeHead(200, SSE_RESPONSE_HEADER)

    res.write("id: " + id + "\n")
    res.write("retry: 2000\n")
    res.write("data: " + JSON.stringify(connectedEvent) + "\n\n")
  }

  public emit(event: DevEventEmitterConnectionEvent | T) {
    this.listeners.forEach((connection) => {
      const id = new Date().toISOString()
      connection.write("id: " + id + "\n")
      connection.write("retry: 2000\n")
      connection.write("data: " + JSON.stringify(event) + "\n\n")
    })
  }
}

export class ServerDevEventEmitter extends DevEventEmitter<ServerDevEvent> {}
export class ClientDevEventEmitter extends DevEventEmitter<ClientDevEvent> {}

// Event listener

export function addDevEventListener<T extends ServerDevEvent | ClientDevEvent>(
  url: string,
  onEvent: (event: T) => void,
  onChangeConnectionStatus: (status: DevEventListenerConnectionStatus) => void,
): () => void {
  const eventSource = new EventSource(url)

  let didConnect = false
  eventSource.onopen = () => {
    didConnect = true
    onChangeConnectionStatus("CONNECTED")
  }

  eventSource.onerror = () => {
    if (didConnect) {
      onChangeConnectionStatus("DISCONNECTED")
    } else {
      onChangeConnectionStatus("EMITTER_NOT_FOUND")
    }
  }

  eventSource.onmessage = async (message) => {
    onEvent(JSON.parse(message.data) as T)
  }

  return () => eventSource.close()
}
