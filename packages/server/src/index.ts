export {
  parser,
  Parser,
  ParseResult,
  RPCResult,
  DataParseError,
} from "@phero/core/runtime"

export type PheroServiceFunctions = Record<string, Function>

export interface PheroServiceDefinition {
  functions: PheroServiceFunctions
  config: PheroServiceConfig
}

export type PheroContext<T = {}> = T

/**
 * By default all middleware input is parsed by Phero. With PheroUnchecked<T> you can
 * mark a property within your middleware context, so that Phero will skip it during
 * the parsing step. E.g.
 * @example
 * ```typescript
 *   async function getArticle(ctx: PheroContext<{ db: PheroUnchecked<RealDB> }>): Promise<string> {
 *     return ctx.db.query()
 *   }
 *
 *   async function myMiddleware(context: PheroContext, next: PheroNextFunction<{ db: PheroUnchecked<DBClient> }>) {
 *     await next({ db: new DBClient() })
 *   }
 * ```
 */
export type PheroUnchecked<T> = T

export type PheroNextFunction<T = void> = T extends void
  ? () => Promise<void>
  : (ctx: T) => Promise<void>

export type PheroMiddlewareFunction<C, N> = (
  ctx: PheroContext<C>,
  next: PheroNextFunction<N>,
) => Promise<void>

export interface PheroServiceConfig {
  middleware: PheroMiddlewareFunction<any, void>[]
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
    config: config ?? { middleware: [] },
    functions,
  }
}
