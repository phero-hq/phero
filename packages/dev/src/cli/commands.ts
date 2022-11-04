import arg from "arg"

export const DEFAULT_SERVER_PORT = 3030
export const DEFAULT_SERVER_URL = `http://localhost:${DEFAULT_SERVER_PORT}`
export const DEFAULT_CLIENT_PORT = 4040

// Server

export enum ServerCommandName {
  Version = "version",
  Help = "help",
  Serve = "serve",
  Export = "export",
  Build = "build",
}

export interface ServerCommandVersion {
  name: ServerCommandName.Version
}

export interface ServerCommandHelp {
  name: ServerCommandName.Help
  command?: ServerCommandName
}

export interface ServerCommandServe {
  name: ServerCommandName.Serve
  verbose: boolean
  port: number
}

export interface ServerCommandExport {
  name: ServerCommandName.Export
  flavor: ServerExportFlavor
  verbose: boolean
}

export enum ServerExportFlavor {
  NodeJS = "nodejs",
  GCloudFunctions = "gcloud-functions",
  Vercel = "vercel",
}

export interface ServerCommandBuild {
  name: ServerCommandName.Build
  verbose: boolean
}

export type ServerCommand =
  | ServerCommandVersion
  | ServerCommandHelp
  | ServerCommandServe
  | ServerCommandExport
  | ServerCommandBuild

// Client

export enum ClientCommandName {
  Version = "version",
  Help = "help",
  Watch = "watch",
  Build = "build",
}

export interface ClientCommandVersion {
  name: ClientCommandName.Version
}

export interface ClientCommandHelp {
  name: ClientCommandName.Help
  command?: ClientCommandName
}

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
  name: ClientCommandName.Watch
  verbose: boolean
  port: number
  server: ClientServerLocationUrl
}

export interface ClientCommandBuild {
  name: ClientCommandName.Build
  verbose: boolean
  server: ClientServerLocation
}

export type ClientCommand =
  | ClientCommandVersion
  | ClientCommandHelp
  | ClientCommandWatch
  | ClientCommandBuild

// Phero

export enum PheroCommandName {
  Version = "version",
  Help = "help",
  Server = "server",
  Client = "client",
  DevEnv = "dev-env",
  Init = "init",
}

export interface PheroCommandVersion {
  name: PheroCommandName.Version
}

export interface PheroCommandHelp {
  name: PheroCommandName.Help
  command?: PheroCommandName
}

export interface PheroCommandServer {
  name: PheroCommandName.Server
  argv: string[]
}

export interface PheroCommandClient {
  name: PheroCommandName.Client
  argv: string[]
}

export interface PheroCommandDevEnv {
  name: PheroCommandName.DevEnv
  verbose: boolean
}

export interface PheroCommandInit {
  name: PheroCommandName.Init
  env?: "client" | "server"
}

export type PheroCommand =
  | PheroCommandVersion
  | PheroCommandHelp
  | PheroCommandServer
  | PheroCommandClient
  | PheroCommandDevEnv
  | PheroCommandInit

export function parseServerCommand(argv: string[]): ServerCommand {
  const args = arg(
    {
      "--version": Boolean,
      "--help": Boolean,
      "--verbose": Boolean,
      "--port": Number,
      "--flavor": String,
      "-v": "--version",
      "-h": "--help",
      "-p": "--port",
    },
    { argv },
  )

  const name = args["_"][0] as ServerCommandName
  const verbose = !!args["--verbose"]

  if (args["--help"]) {
    return { name: ServerCommandName.Help, command: name }
  }

  if (args["--version"]) {
    return { name: ServerCommandName.Version }
  }

  switch (name) {
    case ServerCommandName.Serve:
      const port = args["--port"] ?? DEFAULT_SERVER_PORT
      return { name, verbose, port }

    case ServerCommandName.Export:
      const flavor = parseServerExportFlavor(args["--flavor"])
      return { name, flavor, verbose }

    case ServerCommandName.Build:
      return { name, verbose }

    default:
      throw new Error(`Unknown server command: ${name}`)
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

  const name = args["_"][0] as ClientCommandName
  const location = args["_"][1] // TODO: Is there a better way?
  const verbose = !!args["--verbose"]

  if (args["--help"]) {
    return { name: ClientCommandName.Help, command: name }
  }

  if (args["--version"]) {
    return { name: ClientCommandName.Version }
  }

  switch (name) {
    case ClientCommandName.Watch:
      const port = args["--port"] ?? DEFAULT_CLIENT_PORT

      if (!location) {
        return { name, verbose, port, server: { url: DEFAULT_SERVER_URL } }
      } else if (location.startsWith("http")) {
        return { name, verbose, port, server: { url: location } }
      } else {
        throw new Error("Watching based on file path is not supported ")
      }

    case ClientCommandName.Build:
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

export function parsePheroCommand(argv: string[]): PheroCommand {
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

  const name = args["_"][0] as PheroCommandName
  const verbose = !!args["--verbose"]

  if (name === PheroCommandName.Client || name === PheroCommandName.Server) {
    return { name, argv: argv.slice(1) }
  }

  if (args["--help"]) {
    return { name: PheroCommandName.Help, command: name }
  }

  if (args["--version"]) {
    return { name: PheroCommandName.Version }
  }

  if (name === PheroCommandName.Init) {
    if (argv[1] === "client") {
      return { name, env: "client" }
    } else if (argv[1] === "server") {
      return { name, env: "server" }
    } else {
      return { name }
    }
  }

  if (name === undefined) {
    return {
      name: PheroCommandName.DevEnv,
      verbose,
    }
  } else {
    throw new Error(`unknown phero command: ${name}`)
  }
}

function parseServerExportFlavor(
  flavor: string | undefined,
): ServerExportFlavor {
  switch (flavor) {
    case ServerExportFlavor.NodeJS:
      return ServerExportFlavor.NodeJS
    case ServerExportFlavor.GCloudFunctions:
      return ServerExportFlavor.GCloudFunctions
    case ServerExportFlavor.Vercel:
      return ServerExportFlavor.Vercel
    default:
      throw new Error(
        `Required flavor parameter, must be one of: ${[
          ServerExportFlavor.NodeJS,
          ServerExportFlavor.GCloudFunctions,
          ServerExportFlavor.Vercel,
        ].join(", ")}`,
      )
  }
}
