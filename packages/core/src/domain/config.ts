export interface SamenConfig {
  clients: string[]
}

export enum ClientEnvironment {
  Browser,
  Node,
}

export interface ClientConfig {
  development: { url: string }
  production: { url: string }
  env?: ClientEnvironment
}
