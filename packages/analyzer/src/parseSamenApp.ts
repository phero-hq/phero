import ts from "typescript"
import {
  getChildrenOfKind,
  getFirstChildOfKind,
  hasModifier,
  resolveSymbol,
} from "./tsUtils"

export interface ParsedSamenApp {
  services: ParsedSamenServiceDefinition[]
}

export interface ParsedSamenServiceDefinition {
  name: string
  funcs: ParsedSamenFunctionDefinition[]
}

export interface ParsedSamenFunctionDefinition {
  name: string
  func: ts.FunctionDeclaration
  config: ParsedSamenFunctionConfig
}

export interface ParsedSamenFunctionConfig {
  memory?: number
  timeout?: number

  minInstance?: number
  maxInstance?: number
  middleware?: ts.FunctionDeclaration[]
}

export default function parseSamenApp(
  samenSourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
): ParsedSamenApp {
  console.debug("Start analyzing")
  const t1 = Date.now()

  const syntaxList = getFirstChildOfKind(
    samenSourceFile,
    ts.SyntaxKind.SyntaxList,
  )

  const exportedVariableStatements = getChildrenOfKind(
    syntaxList,
    ts.SyntaxKind.VariableStatement,
  ).filter((s) => hasModifier(s, ts.SyntaxKind.ExportKeyword))

  const variableDeclarations = exportedVariableStatements.flatMap((evs) => {
    const syntaxList = getFirstChildOfKind(
      evs.declarationList,
      ts.SyntaxKind.SyntaxList,
    )
    return getChildrenOfKind(syntaxList, ts.SyntaxKind.VariableDeclaration)
  })

  const services: ParsedSamenServiceDefinition[] = []
  for (const variableDeclaration of variableDeclarations) {
    const service = parseService(variableDeclaration, typeChecker)
    if (service) {
      services.push(service)
    }
  }

  const t2 = Date.now()
  console.debug(`Done analyzing in ${t2 - t1}`)
  return { services }
}

function parseService(
  varDeclr: ts.VariableDeclaration,
  typeChecker: ts.TypeChecker,
): ParsedSamenServiceDefinition | undefined {
  const callExpression = getFirstChildOfKind(
    varDeclr,
    ts.SyntaxKind.CallExpression,
  )

  // check if the value of the export is a function call to "creatService"
  const createServiceCallExpr = getLibFunctionCall(
    callExpression,
    SamenLibFunctions.CreateService,
  )

  if (!createServiceCallExpr) {
    return
  }

  // parsing arguments of createService
  const [functionDefs, serviceConfig] = createServiceCallExpr.arguments
  const parsedServiceConfig = parseFunctionConfig(serviceConfig, typeChecker)
  return {
    name: varDeclr.name.getText(),
    funcs: parseFunctionDefinitions(
      functionDefs,
      parsedServiceConfig,
      typeChecker,
    ),
  }
}

enum SamenLibFunctions {
  CreateService = "createService",
  CreateFunction = "createFunction",
}

function getLibFunctionCall(
  node: ts.Node | undefined,
  libFunction: SamenLibFunctions,
): ts.CallExpression | undefined {
  if (
    node &&
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === libFunction.toString()
  ) {
    return node
  }
}

function parseFunctionDefinitions(
  functionDefs: ts.Expression,
  parsedServiceConfig: ParsedSamenFunctionConfig,
  typeChecker: ts.TypeChecker,
): ParsedSamenFunctionDefinition[] {
  const result: ParsedSamenFunctionDefinition[] = []
  if (ts.isObjectLiteralExpression(functionDefs)) {
    const propertyAssignments = functionDefs.properties
    for (const propertyAssignment of propertyAssignments) {
      const functionName = propertyAssignment.name
      if (functionName) {
        const createFunctionCallExpr = getLibFunctionCall(
          getFirstChildOfKind(propertyAssignment, ts.SyntaxKind.CallExpression),
          SamenLibFunctions.CreateFunction,
        )
        if (createFunctionCallExpr) {
          const [funcArgument, functionConfig] =
            createFunctionCallExpr.arguments
          const parsedFunctionConfig = parseFunctionConfig(
            functionConfig,
            typeChecker,
          )

          const symbol = resolveSymbol(funcArgument, typeChecker)
          if (
            symbol?.valueDeclaration &&
            ts.isFunctionDeclaration(symbol.valueDeclaration)
          ) {
            result.push({
              name: functionName.getText(),
              func: symbol.valueDeclaration,
              config: mergeFunctionConfigs(
                parsedServiceConfig,
                parsedFunctionConfig,
              ),
            })
          }
        }
      }
    }
  }

  return result
}

function parseFunctionConfig(
  configObject: ts.Expression | undefined,
  typeChecker: ts.TypeChecker,
): ParsedSamenFunctionConfig {
  if (configObject && ts.isObjectLiteralExpression(configObject)) {
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
      typeChecker,
    )

    return { memory, timeout, minInstance, maxInstance, middleware }
  }

  return {}
}

function parseFunctionConfigNumberPropValue(
  configObject: ts.ObjectLiteralExpression,
  name: string,
): number | undefined {
  const prop = configObject.properties.find((p) => p.name?.getText() === name)
  if (prop && ts.isPropertyAssignment(prop)) {
    const numericLiteral = getFirstChildOfKind(
      prop,
      ts.SyntaxKind.NumericLiteral,
    )
    if (numericLiteral) {
      const value = Number.parseInt(numericLiteral.getText(), 10)
      return value
    }
  }
}

function parseFunctionConfigMiddlewares(
  configObject: ts.ObjectLiteralExpression,
  name: string,
  typeChecker: ts.TypeChecker,
): ts.FunctionDeclaration[] {
  const prop = configObject.properties.find((p) => p.name?.getText() === name)
  const middlewareArrayLiteralExpr = getFirstChildOfKind(
    prop,
    ts.SyntaxKind.ArrayLiteralExpression,
  )

  if (!middlewareArrayLiteralExpr) {
    return []
  }

  const middlewareArrayElements = middlewareArrayLiteralExpr.elements

  const functionDeclrs: ts.FunctionDeclaration[] = []
  for (const middlewareArrayElement of middlewareArrayElements) {
    // we need getAliasedSymbol to resolve imports
    const symbol = resolveSymbol(middlewareArrayElement, typeChecker)
    if (
      symbol?.valueDeclaration &&
      ts.isFunctionDeclaration(symbol.valueDeclaration)
    ) {
      functionDeclrs.push(symbol.valueDeclaration)
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
