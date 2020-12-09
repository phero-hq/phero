export interface SamenConfig {
  clients: string[]
}

export interface ClientConfig {
  development: { url: string }
  production: { url: string }
}
