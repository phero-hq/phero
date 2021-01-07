export interface SamenConfig {
  clients: string[]
  cors?: CorsConfig
}

export enum ClientEnvironment {
  Browser = "browser",
  Node = "node",
}

export interface CorsConfig {
  whitelist: string[]
}

export interface ClientConfig {
  development: { url: string }
  production: { url: string }
  env?: ClientEnvironment
}
