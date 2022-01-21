const DEFAULT_SERVER_PORT = 3030
const DEFAULT_SERVER_URL = `http://localhost:${DEFAULT_SERVER_PORT}`
const DEFAULT_CLIENT_PORT = 4040

// Server

export interface ServeServerCommand {
  name: "serve"
  port: number
  projectPath: string
}

export interface BuildServerCommand {
  name: "build"
}

export type ServerCommand = ServeServerCommand | BuildServerCommand

// Assumes that the process and file path are already stripped out (https://nodejs.org/en/knowledge/command-line/how-to-parse-command-line-arguments/)
// > serve
// > serve --port 3031
// > build
export function parseServerCommand(args: string[]): ServerCommand {
  const name = args[0]

  switch (name) {
    case "serve":
      return {
        name,
        port: getPort(args) ?? DEFAULT_SERVER_PORT,
        projectPath: process.cwd(),
      }

    case "build":
      return { name }

    default:
      throw new Error(`Unknown server command: ${name}`)
  }
}

// Client

export interface WatchServerCommand {
  name: "watch"
  clientPort: number
  serverPort: number
}

export interface BuildClientCommand {
  name: "build"
  server: { url: string } | { path: string }
}

export type ClientCommand = WatchServerCommand | BuildClientCommand

// Assumes that the process and file path are already stripped out (https://nodejs.org/en/knowledge/command-line/how-to-parse-command-line-arguments/)
// > watch
// > watch --clientPort 4041 --serverPort 3031
// > build
// > build ../server
// > build http://localhost:4321
export function parseClientCommand(args: string[]): ClientCommand {
  const name = args[0]
  const port = getPort(args) ?? DEFAULT_CLIENT_PORT

  switch (name) {
    case "watch": {
      return {
        name,
        clientPort: DEFAULT_CLIENT_PORT,
        serverPort: DEFAULT_SERVER_PORT,
      }
      // const location = args[1]
      // if (!location) {
      //   return { name, port, server: { url: DEFAULT_SERVER_URL } }
      // } else if (location.startsWith("http")) {
      //   return { name, port, server: { url: location } }
      // } else {
      //   throw new Error("Watching based on file path is not supported ")
      // }
    }

    case "build": {
      const location = args[1]
      if (!location) {
        return { name, server: { url: DEFAULT_SERVER_URL } }
      } else if (location.startsWith("http")) {
        return { name, server: { url: location } }
      } else {
        return { name, server: { path: location } }
      }
    }

    default:
      throw new Error(`Unknown client command: ${name}`)
  }
}

// Helpers

function getPort(args: string[]): number | undefined {
  const portIndex = args.findIndex((a) => a === "--port")
  return portIndex > -1 ? parseInt(args[portIndex + 1]) : undefined
}
