import http from "http"
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

export type ServerDevEventRPC =
  | ServerDevEventRPCStart
  | ServerDevEventRPCSuccess
  | ServerDevEventRPCFailedValidationError
  | ServerDevEventRPCFailedFunctionError
  | ServerDevEventRPCFailedServerError
  | ServerDevEventRPCFailedNotFoundError

export type ServerDevEventRPCStart = {
  type: "RPC_START"
  url: string
  requestId: string
  dateTime: string // ISO-8601
}

export type ServerDevEventRPCSuccess = {
  type: "RPC_SUCCESS"
  url: string
  requestId: string
  dateTime: string // ISO-8601
  ms: number
}

export interface ValidationError {
  path: string
  message: string
}

export interface RuntimeError {
  name: string
  props: Record<string, any>
  stack: string
}

export interface ServerError {
  message: string
  stack: string
}

export type ServerDevEventRPCFailedValidationError = {
  type: "RPC_FAILED_VALIDATION_ERROR"
  url: string
  requestId: string
  dateTime: string // ISO-8601
  ms: number
  errors: ValidationError[]
  input: any
}

export type ServerDevEventRPCFailedFunctionError = {
  type: "RPC_FAILED_FUNCTION_ERROR"
  url: string
  requestId: string
  dateTime: string // ISO-8601
  ms: number
  error: RuntimeError
}

export type ServerDevEventRPCFailedServerError = {
  type: "RPC_FAILED_SERVER_ERROR"
  url: string
  requestId: string
  dateTime: string // ISO-8601
  ms: number
  error: ServerError
}

export type ServerDevEventRPCFailedNotFoundError = {
  type: "RPC_FAILED_NOT_FOUND_ERROR"
  url: string
  requestId: string
  dateTime: string // ISO-8601
  ms: number
}

export type ServerDevEvent =
  | DevEventEmitterConnectionEvent

  // Init
  | { type: "SERVE_INIT" }
  | { type: "SERVE_READY" }

  // Building the project
  | { type: "BUILD_PROJECT_START" }
  | { type: "BUILD_PROJECT_SUCCESS" }
  | { type: "BUILD_PROJECT_FAILED"; errorMessage: string }

  // Building the manifest file
  | { type: "BUILD_MANIFEST_START" }
  | { type: "BUILD_MANIFEST_SUCCESS" }
  | { type: "BUILD_MANIFEST_FAILED"; errorMessage: string }

  // Building the RPC's
  | { type: "BUILD_RPCS_START" }
  | { type: "BUILD_RPCS_SUCCESS" }
  | { type: "BUILD_RPCS_FAILED"; errorMessage: string }

  // Running the RPC's
  | ServerDevEventRPCStart
  | ServerDevEventRPCSuccess
  | ServerDevEventRPCFailedValidationError
  | ServerDevEventRPCFailedFunctionError
  | ServerDevEventRPCFailedServerError
  | ServerDevEventRPCFailedNotFoundError

export type ClientDevEvent =
  | DevEventEmitterConnectionEvent

  // Watch init
  | { type: "WATCH_INIT" }
  | { type: "WATCH_READY" }

  // Connecting to a server's emitter
  | { type: "SERVER_CONNECTED" }
  | { type: "SERVER_DISCONNECTED"; errorMessage: string }
  | { type: "SERVER_NOT_FOUND"; errorMessage: string }

  // Building the client
  | { type: "BUILD_START" }
  | { type: "BUILD_SUCCESS" }
  | { type: "BUILD_FAILED"; errorMessage: string }

// Event emitters

class DevEventEmitter<T extends ServerDevEvent | ClientDevEvent> {
  private lastEvent?: DevEventEmitterConnectionEvent | T

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

    this.emitToListeners(connectedEvent, [res])
    if (this.lastEvent) {
      this.emitToListeners(this.lastEvent, [res])
    }
  }

  public emit(event: DevEventEmitterConnectionEvent | T) {
    this.lastEvent = event
    this.emitToListeners(event, this.listeners)
  }

  private emitToListeners(
    event: DevEventEmitterConnectionEvent | T,
    listeners: http.ServerResponse[],
  ) {
    listeners.forEach((connection) => {
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
// NOTE: The same event could be emitted multiple times

export function addDevEventListener<T extends ServerDevEvent | ClientDevEvent>(
  url: string,
  onEvent: (event: T) => void,
  onOpen: () => void,
  onError: (errorMessage: string) => void,
): () => void {
  const eventSource = new EventSource(url)

  eventSource.onopen = () => onOpen()

  eventSource.onerror = (error) => onError((error as any).message)

  eventSource.onmessage = async (message) => {
    onEvent(JSON.parse(message.data) as T)
  }

  return () => eventSource.close()
}
