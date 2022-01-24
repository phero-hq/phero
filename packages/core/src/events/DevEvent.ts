import http from "http"
import EventSource from "eventsource"

const SSE_RESPONSE_HEADER = {
  Connection: "keep-alive",
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "X-Accel-Buffering": "no",
}

export type ServerDevEvent =
  // Connecting a listener, from the emitter's perspective
  | { type: "LISTENER_CONNECTED"; id: string }
  | { type: "LISTENER_DISCONNECTED"; id: string }

  // Connecting a listener, from the listeners's perspective
  | { type: "SERVER_CONNECTED" }
  | { type: "SERVER_DISCONNECTED" }
  | { type: "SERVER_NOT_FOUND" }

  // Init
  | { type: "SERVE_INIT" }
  | { type: "SERVE_READY" }

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
  | { type: "RPC_SUCCESS" }
  | { type: "RPC_FAILED"; error: string }

export type ClientDevEvent =
  // Connecting a listener, from the emitter's perspective
  | { type: "LISTENER_CONNECTED"; id: string }
  | { type: "LISTENER_DISCONNECTED"; id: string }

  // Connecting a listener, from the listeners's perspective
  | { type: "SERVER_CONNECTED" }
  | { type: "SERVER_DISCONNECTED" }
  | { type: "SERVER_NOT_FOUND" }

  // Connecting a listener, from the listeners's perspective
  | { type: "CLIENT_CONNECTED" }
  | { type: "CLIENT_DISCONNECTED" }
  | { type: "CLIENT_NOT_FOUND" }

  // Watch init
  | { type: "WATCH_INIT" }
  | { type: "WATCH_READY" }

  // Building the client
  | { type: "BUILD_START" }
  | { type: "BUILD_SUCCESS" }
  | { type: "BUILD_FAILED"; error: string }

// Event emitters

export class ServerDevEventEmitter {
  public listeners: http.ServerResponse[] = []

  public shouldRegisterListener(req: http.IncomingMessage): boolean {
    return !!req.headers.accept?.includes("text/event-stream")
  }

  public registerListener(res: http.ServerResponse) {
    const id = new Date().toISOString()
    const connectedEvent: ServerDevEvent = { type: "LISTENER_CONNECTED", id }

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

  public emit(event: ServerDevEvent) {
    this.listeners.forEach((connection) => {
      const id = new Date().toISOString()
      connection.write("id: " + id + "\n")
      connection.write("retry: 2000\n")
      connection.write("data: " + JSON.stringify(event) + "\n\n")
    })
  }
}

export class ClientDevEventEmitter {
  public listeners: http.ServerResponse[] = []

  public shouldRegisterListener(req: http.IncomingMessage): boolean {
    return !!req.headers.accept?.includes("text/event-stream")
  }

  public registerListener(res: http.ServerResponse) {
    const id = new Date().toISOString()
    const connectedEvent: ClientDevEvent = { type: "LISTENER_CONNECTED", id }

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

  public emit(event: ClientDevEvent) {
    this.listeners.forEach((connection) => {
      const id = new Date().toISOString()
      connection.write("id: " + id + "\n")
      connection.write("retry: 2000\n")
      connection.write("data: " + JSON.stringify(event) + "\n\n")
    })
  }
}

// Event listeners

export function addServerDevEventListener(
  url: string,
  callback: (event: ServerDevEvent) => void,
): () => void {
  const eventSource = new EventSource(url)

  let didConnect = false
  eventSource.onopen = () => {
    didConnect = true
    callback({ type: "SERVER_CONNECTED" })
  }

  eventSource.onmessage = async (message) => {
    const event = JSON.parse(message.data) as ServerDevEvent
    callback(event)
  }

  eventSource.onerror = () => {
    if (didConnect) {
      callback({ type: "SERVER_DISCONNECTED" })
    } else {
      callback({ type: "SERVER_NOT_FOUND" })
    }
  }

  return () => eventSource.close()
}

export function addClientDevEventListener(
  url: string,
  callback: (event: ClientDevEvent) => void,
): () => void {
  const eventSource = new EventSource(url)

  let didConnect = false
  eventSource.onopen = () => {
    didConnect = true
    callback({ type: "CLIENT_CONNECTED" })
  }

  eventSource.onmessage = async (message) => {
    const event = JSON.parse(message.data) as ClientDevEvent
    callback(event)
  }

  eventSource.onerror = () => {
    if (didConnect) {
      callback({ type: "CLIENT_DISCONNECTED" })
    } else {
      callback({ type: "CLIENT_NOT_FOUND" })
    }
  }

  return () => eventSource.close()
}
