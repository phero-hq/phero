// export function createService(x: any): SamenServiceDefinition {}
// export function createFunction(x: any): SamenFunctionDefinition {}

// type SamenServiceDefinition = Record<
//   string,
//   SamenFunctionDefinition | Function
// >

// interface SamenFunctionDefinition {

// }

type ServiceFunctionsDefinitions = Record<
  string,
  SamenFunctionDefinition | Function
>

export type SamenServiceDefinition<
  TFuncsDef extends ServiceFunctionsDefinitions,
> = {
  config: SamenServiceConfig
  functions: {
    [funcName in keyof TFuncsDef]: SamenFunctionDefinition
  }
}

export interface SamenFunctionDefinition {
  func: Function
  config: SamenFunctionConfig
}

export interface SamenServiceConfig {
  memory?: 512 | 1024 | 2048
  timeout?: number
  minInstance?: number
  maxInstance?: number
  middleware?: SamenMiddlewareFunction[]
}

export interface SamenFunctionConfig {
  memory?: 512 | 1024 | 2048
  timeout?: number
}

export type NextFunction<T = void> = T extends void
  ? () => Promise<void>
  : (ctx: T) => Promise<void>

export type SamenContext<TIn> = TIn

export type SamenMiddlewareFunction = <COut, CIn>(
  next: NextFunction<COut>,
  ctx?: SamenContext<CIn>,
) => Promise<void>

export function createService<TFuncsDef extends ServiceFunctionsDefinitions>(
  functions: TFuncsDef,
  config?: SamenServiceConfig,
): SamenServiceDefinition<TFuncsDef> {
  return {
    config: config ?? {},
    functions: Object.entries(functions).reduce(
      (result, [funcName, funcDef]) => {
        return {
          ...result,
          [funcName]:
            typeof funcDef === "function"
              ? createFunction(funcDef, {})
              : createFunction(funcDef.func, funcDef.config),
        }
      },
      {} as {
        [funcName in keyof TFuncsDef]: SamenFunctionDefinition
      },
    ),
  }
}

export function createFunction(
  func: Function,
  config?: SamenFunctionConfig,
): SamenFunctionDefinition {
  return {
    func,
    config: config ?? {},
  }
}
