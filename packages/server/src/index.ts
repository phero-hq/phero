export type SamenServiceFunctions = Record<string, Function>

export interface SamenServiceDefinition {
  functions: SamenServiceFunctions
  config: SamenServiceConfig
}

export type SamenParams<T = {}> = Partial<T>

export type SamenContext<T = {}> = T

export type SamenNextFunction<T = void> = T extends void
  ? () => Promise<void>
  : (ctx: T) => Promise<void>

export type SamenMiddlewareFunction<P, C, N> = (
  params: SamenParams<P>,
  ctx: SamenContext<C>,
  next: SamenNextFunction<N>,
) => Promise<void>

export interface SamenServiceConfig {
  middleware?: SamenMiddlewareFunction<any, any, void>[]
}

export function createService(
  functions: SamenServiceFunctions,
  config?: SamenServiceConfig,
): SamenServiceDefinition {
  return {
    config: config ?? {},
    functions,
  }
}
