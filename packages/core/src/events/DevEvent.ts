import http from "http"
import EventSource from "eventsource"

const SSE_RESPONSE_HEADER = {
  Connection: "keep-alive",
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "X-Accel-Buffering": "no",
}

export type DevEvent =
  // Connecting a listener to an emitter
  | { type: "EMITTER_LISTENER_CONNECTED"; id: string }
  | { type: "EMITTER_LISTENER_DISCONNECTED"; id: string }
  | { type: "LISTENER_EMITTER_CONNECTED" }
  | { type: "LISTENER_EMITTER_DISCONNECTED" }
  | { type: "LISTENER_EMITTER_NOT_FOUND" }

  // Serve init
  | { type: "SERVER_SERVE_INIT" }
  | { type: "SERVER_SERVE_READY" }

  // Building the manifest file
  | { type: "SERVER_BUILD_MANIFEST_START" }
  | { type: "SERVER_BUILD_MANIFEST_SUCCESS" }
  | { type: "SERVER_BUILD_MANIFEST_FAILED"; error: unknown }

  // Building the RPC's
  | { type: "SERVER_BUILD_RPCS_START" }
  | { type: "SERVER_BUILD_RPCS_SUCCESS" }
  | { type: "SERVER_BUILD_RPCS_FAILED"; error: unknown }

  // Running the RPC's
  | { type: "SERVER_RPC_START"; url?: string }
  | { type: "SERVER_RPC_SUCCESS" }
  | { type: "SERVER_RPC_FAILED"; error: unknown }

  // Watch init
  | { type: "CLIENT_WATCH_INIT" }
  | { type: "CLIENT_WATCH_READY" }

  // Building the client
  | { type: "CLIENT_BUILD_START" }
  | { type: "CLIENT_BUILD_SUCCESS" }
  | { type: "CLIENT_BUILD_FAILED"; error: unknown }

// Event emitter

export class DevEventEmitter {
  public listeners: http.ServerResponse[] = []

  public shouldRegisterListener(req: http.IncomingMessage): boolean {
    return !!req.headers.accept?.includes("text/event-stream")
  }

  public registerListener(res: http.ServerResponse) {
    const id = new Date().toISOString()
    const connectedEvent: DevEvent = { type: "EMITTER_LISTENER_CONNECTED", id }

    this.listeners.push(res)
    res.on("close", () => {
      this.listeners = this.listeners.filter((listener) => listener !== res)
      this.emit({ type: "EMITTER_LISTENER_DISCONNECTED", id })
    })
    res.writeHead(200, SSE_RESPONSE_HEADER)

    res.write("id: " + id + "\n")
    res.write("retry: 2000\n")
    res.write("data: " + JSON.stringify(connectedEvent) + "\n\n")
  }

  public emit(event: DevEvent) {
    console.log("emit", event)
    this.listeners.forEach((connection) => {
      const id = new Date().toISOString()
      connection.write("id: " + id + "\n")
      connection.write("retry: 2000\n")
      connection.write("data: " + JSON.stringify(event) + "\n\n")
    })
  }
}

// Event listener

export function addEventListener(
  url: string,
  callback: (event: DevEvent) => void,
): () => void {
  const eventSource = new EventSource(url)

  let didConnect = false
  eventSource.onopen = () => {
    didConnect = true
    callback({ type: "LISTENER_EMITTER_CONNECTED" })
  }

  eventSource.onmessage = async (message) => {
    const event = JSON.parse(message.data) as DevEvent
    callback(event)
  }

  eventSource.onerror = (error) => {
    if (didConnect) {
      callback({ type: "LISTENER_EMITTER_DISCONNECTED" })
    } else {
      callback({ type: "LISTENER_EMITTER_NOT_FOUND" })
    }
  }

  return () => eventSource.close()
}
