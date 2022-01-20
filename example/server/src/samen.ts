interface Article {
  id: string
  text: string
}

async function getArticle(id: string): Promise<Article> {
  return {
    id,
    text: "",
  }
}
async function createArticle(id: string): Promise<Article> {
  return {
    id,
    text: "",
  }
}

async function saveArticle(id: string, text: string): Promise<Article> {
  return {
    id,
    text,
  }
}

export const articleService = createService({
  get: createFunction(getArticle),
  create: createFunction(createArticle),
  save: createFunction(saveArticle),
})

function createService(x: any): any {}
function createFunction(x: any): any {}

// type ServiceFunctionsDefinitions = Record<
//   string,
//   SamenFunctionDefinition | Function
// >

// export type SamenServiceDefinition<
//   TFuncsDef extends ServiceFunctionsDefinitions,
// > = {
//   [funcName in keyof TFuncsDef]: SamenFunctionDefinition
// }

// export interface SamenFunctionDefinition {
//   func: Function
//   config: SamenFunctionConfig
// }

// export interface SamenFunctionConfig {
//   memory?: 512 | 1024 | 2048
//   timeout?: number
//   minInstance?: number
//   maxInstance?: number
//   middleware?: Function[]
// }

// function createService<TFuncsDef extends ServiceFunctionsDefinitions>(
//   functions: TFuncsDef,
//   config?: SamenFunctionConfig,
// ): SamenServiceDefinition<TFuncsDef> {
//   return Object.entries(functions).reduce(
//     (result, [funcName, funcDef]) => {
//       return {
//         ...result,
//         [funcName]:
//           typeof funcDef === "function"
//             ? createFunction(funcDef, config)
//             : createFunction(
//                 funcDef.func,
//                 mergeConfigs(config, funcDef.config),
//               ),
//       }
//     },
//     {} as {
//       [funcName in keyof TFuncsDef]: SamenFunctionDefinition
//     },
//   )
// }

// function createFunction(
//   func: Function,
//   config?: SamenFunctionConfig,
// ): SamenFunctionDefinition {
//   return {
//     func,
//     config: config ?? {},
//   }
// }

// function mergeConfigs(
//   serviceConfig?: SamenFunctionConfig,
//   functionConfig?: SamenFunctionConfig,
// ): SamenFunctionConfig {
//   return {
//     memory: functionConfig?.memory ?? serviceConfig?.memory,
//     timeout: functionConfig?.timeout ?? serviceConfig?.timeout,
//     minInstance: functionConfig?.minInstance ?? serviceConfig?.minInstance,
//     maxInstance: functionConfig?.maxInstance ?? serviceConfig?.maxInstance,
//     middleware: functionConfig?.middleware ?? serviceConfig?.middleware,
//   }
// }
