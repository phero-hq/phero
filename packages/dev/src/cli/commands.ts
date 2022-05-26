import arg from "arg"

export const DEFAULT_SERVER_PORT = 3030
export const DEFAULT_SERVER_URL = `http://localhost:${DEFAULT_SERVER_PORT}`
export const DEFAULT_CLIENT_PORT = 4040

// Common

export type CommonCommand =
  | { name: "help"; command?: string }
  | { name: "version" }

// Server

export interface ServerCommandServe {
  name: "serve"
  verbose: boolean
  port: number
}

export interface ServerCommandBuild {
  name: "build"
  verbose: boolean
}

export type ServerCommand =
  | CommonCommand
  | ServerCommandServe
  | ServerCommandBuild

// Client

interface ClientServerLocationUrl {
  url: string
}

interface ClientServerLocationPath {
  path: string
}

export type ClientServerLocation =
  | ClientServerLocationUrl
  | ClientServerLocationPath

export interface ClientCommandWatch {
  name: "watch"
  verbose: boolean
  port: number
  server: ClientServerLocationUrl
}

export interface ClientCommandBuild {
  name: "build"
  verbose: boolean
  server: ClientServerLocation
}

export type ClientCommand =
  | CommonCommand
  | ClientCommandWatch
  | ClientCommandBuild

// Samen

export interface SamenCommandServer {
  name: "server"
  verbose: boolean
  command: ServerCommand
}

export interface SamenCommandClient {
  name: "client"
  verbose: boolean
  command: ClientCommand
}

export interface SamenCommandDevEnv {
  name: "dev-env"
  verbose: boolean
}

export type SamenCommand =
  | CommonCommand
  | SamenCommandServer
  | SamenCommandClient
  | SamenCommandDevEnv

export function parseServerCommand(argv: string[]): ServerCommand {
  const args = arg(
    {
      "--version": Boolean,
      "--help": Boolean,
      "--verbose": Boolean,
      "--port": Number,
      "-v": "--version",
      "-h": "--help",
      "-p": "--port",
    },
    { argv },
  )

  const name = args["_"][0]
  const verbose = !!args["--verbose"]

  if (args["--help"]) {
    return { name: "help", command: name }
  }

  if (args["--version"]) {
    return { name: "version" }
  }

  switch (name) {
    case "serve":
      const port = args["--port"] ?? DEFAULT_SERVER_PORT
      return { name, verbose, port }

    case "build":
      return { name, verbose }

    default:
      throw new Error(`unknown server command: ${name}`)
  }
}

export function parseClientCommand(argv: string[]): ClientCommand {
  const args = arg(
    {
      "--version": Boolean,
      "--help": Boolean,
      "--verbose": Boolean,
      "--port": Number,
      "-v": "--version",
      "-h": "--help",
      "-p": "--port",
    },
    { argv },
  )

  const name = args["_"][0]
  const location = args["_"][1] // TODO: Is there a better way?
  const verbose = !!args["--verbose"]

  if (args["--help"]) {
    return { name: "help", command: name }
  }

  if (args["--version"]) {
    return { name: "version" }
  }

  switch (name) {
    case "watch":
      const port = args["--port"] ?? DEFAULT_CLIENT_PORT

      if (!location) {
        return { name, verbose, port, server: { url: DEFAULT_SERVER_URL } }
      } else if (location.startsWith("http")) {
        return { name, verbose, port, server: { url: location } }
      } else {
        throw new Error("Watching based on file path is not supported ")
      }

    case "build":
      if (!location) {
        return { name, verbose, server: { url: DEFAULT_SERVER_URL } }
      } else if (location.startsWith("http")) {
        return { name, verbose, server: { url: location } }
      } else {
        return { name, verbose, server: { path: location } }
      }

    default:
      throw new Error(`unknown client command: ${name}`)
  }
}

export function parseSamenCommand(argv: string[]): SamenCommand {
  const args = arg(
    {
      "--version": Boolean,
      "--help": Boolean,
      "--verbose": Boolean,
      "-v": "--version",
      "-h": "--help",
    },
    { argv, permissive: true },
  )

  const name = args["_"][0]
  const verbose = !!args["--verbose"]

  if (args["--help"]) {
    return { name: "help", command: name }
  }

  if (args["--version"]) {
    return { name: "version" }
  }

  switch (name) {
    case undefined:
      return {
        name: "dev-env",
        verbose,
      }

    case "client":
      return {
        name: "client",
        verbose,
        command: parseClientCommand(argv.slice(1)),
      }

    case "server":
      return {
        name: "server",
        verbose,
        command: parseServerCommand(argv.slice(1)),
      }

    default:
      throw new Error(`unknown samen command: ${name}`)
  }
}
