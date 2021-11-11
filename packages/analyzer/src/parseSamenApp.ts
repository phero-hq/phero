import {
  ExportedDeclarations,
  Node,
  SourceFile,
  TypeChecker,
  ts,
  CallExpression,
  ObjectLiteralExpression,
  FunctionDeclaration,
} from "ts-morph"

export interface ParsedSamenApp {
  services: ParsedSamenServiceDefinition[]
}

export interface ParsedSamenServiceDefinition {
  name: string
  funcs: ParsedSamenFunctionDefinition[]
}

export interface ParsedSamenFunctionDefinition {
  name: string
  func: FunctionDeclaration
  config: ParsedSamenFunctionConfig
}

export interface ParsedSamenFunctionConfig {
  memory?: number
  timeout?: number

  minInstance?: number
  maxInstance?: number
  middleware?: FunctionDeclaration[]
}

export default function parseSamenApp(
  samenSourceFile: SourceFile,
): ParsedSamenApp {
  console.debug("Start analyzing")
  const t1 = Date.now()

  const services: ParsedSamenServiceDefinition[] = []

  for (const [
    exportName,
    exportDeclrs,
  ] of samenSourceFile.getExportedDeclarations()) {
    for (const exportDeclr of exportDeclrs) {
      const service = parseService(exportName, exportDeclr)
      if (service) {
        services.push(service)
      }
    }
  }

  const t2 = Date.now()
  console.debug(`Done analyzing in ${t2 - t1}`)
  return { services }
}

function parseService(
  exportName: string,
  exportDeclr: ExportedDeclarations,
): ParsedSamenServiceDefinition | undefined {
  // check if we are exporting a variable
  if (Node.isVariableDeclaration(exportDeclr)) {
    // check if the value of the export is a function call to "creatService"
    const createServiceCallExpr = getLibFunctionCall(
      exportDeclr.getInitializer(),
      SamenLibFunctions.CreateService,
    )
    if (createServiceCallExpr) {
      // parsing arguments of createService
      const [functionDefs, serviceConfig] = createServiceCallExpr.getArguments()
      const parsedServiceConfig = parseFunctionConfig(serviceConfig)
      return {
        name: exportName,
        funcs: parseFunctionDefinitions(functionDefs, parsedServiceConfig),
      }
    }
  }
}

enum SamenLibFunctions {
  CreateService = "createService",
  CreateFunction = "createFunction",
}

function getLibFunctionCall(
  node: Node | undefined,
  libFunction: SamenLibFunctions,
): CallExpression | undefined {
  if (node && Node.isCallExpression(node)) {
    const functionNameIdentifier = node.getFirstChildByKind(
      ts.SyntaxKind.Identifier,
    )
    if (
      functionNameIdentifier &&
      functionNameIdentifier.getText() === libFunction.toString()
    ) {
      return node
    }
  }
}

function parseFunctionDefinitions(
  functionDefs: Node,
  parsedServiceConfig: ParsedSamenFunctionConfig,
): ParsedSamenFunctionDefinition[] {
  const result: ParsedSamenFunctionDefinition[] = []

  if (Node.isObjectLiteralExpression(functionDefs)) {
    const properties = functionDefs.getChildrenOfKind(
      ts.SyntaxKind.PropertyAssignment,
    )
    for (const property of properties) {
      const functionName = property.getChildrenOfKind(ts.SyntaxKind.Identifier)
      const createFunctionCallExpr = getLibFunctionCall(
        property.getFirstChildByKind(ts.SyntaxKind.CallExpression),
        SamenLibFunctions.CreateFunction,
      )
      if (createFunctionCallExpr) {
        const [funcArgument, functionConfig] =
          createFunctionCallExpr.getArguments()
        const parsedFunctionConfig = parseFunctionConfig(functionConfig)

        const funcDeclr =
          // we need getAliasedSymbol to resolve imports
          (
            funcArgument.getSymbol()?.getAliasedSymbol() ??
            funcArgument.getSymbol()
          )?.getValueDeclaration()

        if (Node.isFunctionDeclaration(funcDeclr)) {
          result.push({
            name: functionName?.[0].getText(),
            func: funcDeclr,
            config: mergeFunctionConfigs(
              parsedServiceConfig,
              parsedFunctionConfig,
            ),
          })
        }
      }
    }
  }

  return result
}

function parseFunctionConfig(
  configObject: Node | undefined,
): ParsedSamenFunctionConfig {
  if (configObject && Node.isObjectLiteralExpression(configObject)) {
    const memory = parseFunctionConfigNumberPropValue(configObject, "memory")
    const timeout = parseFunctionConfigNumberPropValue(configObject, "timeout")
    const minInstance = parseFunctionConfigNumberPropValue(
      configObject,
      "minInstance",
    )
    const maxInstance = parseFunctionConfigNumberPropValue(
      configObject,
      "maxInstance",
    )
    const middleware = parseFunctionConfigMiddlewares(
      configObject,
      "middleware",
    )
    return { memory, timeout, minInstance, maxInstance, middleware }
  }

  return {}
}

function parseFunctionConfigNumberPropValue(
  configObject: ObjectLiteralExpression,
  name: string,
): number | undefined {
  const prop = configObject.getProperty(name)
  if (prop && Node.isPropertyAssignment(prop)) {
    const numericLiteral = prop.getLastChildByKind(ts.SyntaxKind.NumericLiteral)
    if (numericLiteral) {
      const value = Number.parseInt(numericLiteral.getText(), 10)
      return value
    }
  }
}

function parseFunctionConfigMiddlewares(
  configObject: ObjectLiteralExpression,
  name: string,
): FunctionDeclaration[] {
  const middlewareArrayLiteralExpr = configObject
    .getProperty(name)
    ?.getFirstChildByKind(ts.SyntaxKind.ArrayLiteralExpression)

  if (!middlewareArrayLiteralExpr) {
    return []
  }

  const middlewareArrayElements = middlewareArrayLiteralExpr.getElements()

  const functionDeclrs: FunctionDeclaration[] = []
  for (const middlewareArrayElement of middlewareArrayElements) {
    // we need getAliasedSymbol to resolve imports
    const funcDeclr = (
      middlewareArrayElement.getSymbol()?.getAliasedSymbol() ??
      middlewareArrayElement.getSymbol()
    )?.getValueDeclaration()

    if (Node.isFunctionDeclaration(funcDeclr)) {
      functionDeclrs.push(funcDeclr)
    }
  }
  return functionDeclrs
}

function mergeFunctionConfigs(
  serviceConfig: ParsedSamenFunctionConfig,
  functionConfig: ParsedSamenFunctionConfig,
): ParsedSamenFunctionConfig {
  return {
    memory: functionConfig.memory ?? serviceConfig.memory,
    timeout: functionConfig.timeout ?? serviceConfig.timeout,
    minInstance: functionConfig.minInstance ?? serviceConfig.minInstance,
    maxInstance: functionConfig.maxInstance ?? serviceConfig.maxInstance,
    middleware: functionConfig.middleware ?? serviceConfig.middleware,
  }
}
