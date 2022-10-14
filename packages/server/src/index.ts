export type PheroServiceFunctions = Record<string, Function>

export interface PheroServiceDefinition {
  functions: PheroServiceFunctions
  config: PheroServiceConfig
}

export type PheroParams<T = {}> = Partial<T>

export type PheroContext<T = {}> = T

export type PheroNextFunction<T = void> = T extends void
  ? () => Promise<void>
  : (ctx: T) => Promise<void>

export type PheroMiddlewareFunction<P, C, N> = (
  params: PheroParams<P>,
  ctx: PheroContext<C>,
  next: PheroNextFunction<N>,
) => Promise<void>

export interface PheroServiceConfig {
  middleware?: PheroMiddlewareFunction<any, any, void>[]
  cors?: PheroCORSConfig
}

export interface PheroCORSConfig {
  originWhitelist: string[]
}

export function createService(
  functions: PheroServiceFunctions,
  config?: PheroServiceConfig,
): PheroServiceDefinition {
  return {
    config: config ?? {},
    functions,
  }
}
