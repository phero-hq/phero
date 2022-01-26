const DEFAULT_SERVER_PORT = 3030
const DEFAULT_SERVER_URL = `http://localhost:${DEFAULT_SERVER_PORT}`
const DEFAULT_CLIENT_PORT = 4040

// Server

export interface ServeServerCommand {
  name: "serve"
  port: number
  quiet: boolean // `npx samen` has its own eventlistener, no need to output anything
}

export interface BuildServerCommand {
  name: "build"
}

export type ServerCommand = ServeServerCommand | BuildServerCommand

// Assumes that the process and file path are already stripped out (https://nodejs.org/en/knowledge/command-line/how-to-parse-command-line-arguments/)
// > serve
// > serve --p 3031
// > serve --port 3031
// > build
export function parseServerCommand(args: string[]): ServerCommand {
  const name = args[0]

  switch (name) {
    case "serve":
      return {
        name,
        port: getPort(args) ?? DEFAULT_SERVER_PORT,
        quiet: getQuiet(args),
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
  port: number
  server: { url: string } // TODO: Strip trailing slash
  quiet: boolean // `npx samen` has its own eventlistener, no need to output anything
}

export interface BuildClientCommand {
  name: "build"
  server:
    | { url: string } // TODO: Strip trailing slash
    | { path: string }
}

export type ClientCommand = WatchServerCommand | BuildClientCommand

// Assumes that the process and file path are already stripped out (https://nodejs.org/en/knowledge/command-line/how-to-parse-command-line-arguments/)
// > watch
// > watch --p 4041
// > watch --port 4041
// > watch http://localhost:3031
// > watch http://localhost:3031 --port 4041
// > build
// > build ../server
// > build http://localhost:4321
export function parseClientCommand(args: string[]): ClientCommand {
  const name = args[0]
  const port = getPort(args) ?? DEFAULT_CLIENT_PORT

  switch (name) {
    case "watch": {
      const location = !args[1]?.startsWith("-") && args[1]
      if (!location) {
        return {
          name,
          port,
          server: { url: DEFAULT_SERVER_URL },
          quiet: getQuiet(args),
        }
      } else if (location.startsWith("http")) {
        return {
          name,
          port,
          server: { url: location },
          quiet: getQuiet(args),
        }
      } else {
        throw new Error("Watching based on file path is not supported ")
      }
    }

    case "build": {
      const location = !args[1]?.startsWith("-") && args[1]
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

// Samen

export interface SamenCommand {
  debug: boolean
}

export function parseSamenCommand(args: string[]): SamenCommand {
  return {
    debug: args.includes("--debug"),
  }
}

// Helpers

function getPort(args: string[]): number | undefined {
  const portIndex = args.findIndex((a) => ["-p", "--port"].includes(a))
  return portIndex > -1 ? parseInt(args[portIndex + 1]) : undefined
}

function getQuiet(args: string[]): boolean {
  return args.some((a) => a === "--quiet")
}
