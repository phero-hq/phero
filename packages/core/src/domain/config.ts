export interface SamenConfig {
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
  env?: ClientEnvironment
}
