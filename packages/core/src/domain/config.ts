export interface SamenConfig {
  clients: string[]
}

export enum ClientEnvironment {
  Browser = "browser",
  Node = "node",
}

export interface ClientConfig {
  development: { url: string }
  production: { url: string }
  env?: ClientEnvironment
}
