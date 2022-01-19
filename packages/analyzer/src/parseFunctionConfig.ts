import ts from "typescript"
import { ParseError } from "./errors"
import { ParsedSamenFunctionConfig } from "./parseSamenApp"
import { getFirstChildOfKind, resolveSymbol } from "./tsUtils"

export default function parseFunctionConfig(
  node: ts.Node | undefined,
  typeChecker: ts.TypeChecker,
): ParsedSamenFunctionConfig {
  if (!node) {
    return {}
  }

  if (ts.isObjectLiteralExpression(node)) {
    const memory = parseFunctionConfigNumberPropValue(
      node,
      "memory",
      typeChecker,
    )
    const timeout = parseFunctionConfigNumberPropValue(
      node,
      "timeout",
      typeChecker,
    )
    const minInstance = parseFunctionConfigNumberPropValue(
      node,
      "minInstance",
      typeChecker,
    )
    const maxInstance = parseFunctionConfigNumberPropValue(
      node,
      "maxInstance",
      typeChecker,
    )
    const middleware = parseFunctionConfigMiddlewares(
      node,
      "middleware",
      typeChecker,
    )

    return { memory, timeout, minInstance, maxInstance, middleware }
  }

  if (ts.isIdentifier(node)) {
    const symbol = resolveSymbol(node, typeChecker)
    if (symbol) {
      return parseFunctionConfig(symbol.valueDeclaration, typeChecker)
    }
  }

  if (ts.isVariableDeclaration(node)) {
    return parseFunctionConfig(node.initializer, typeChecker)
  }

  throw new ParseError("Unsupport syntax for function config", node)
}

function parseFunctionConfigNumberPropValue(
  configObject: ts.ObjectLiteralExpression,
  name: string,
  typeChecker: ts.TypeChecker,
): number | undefined {
  const prop = configObject.properties.find((p) => p.name?.getText() === name)
  if (!prop) {
    return undefined
  }

  return parseProp(prop)

  function parseProp(node: ts.Node): number | undefined {
    if (ts.isNumericLiteral(node)) {
      const value = Number.parseInt(node.getText(), 10)
      return value
    } else if (ts.isPropertyAssignment(node)) {
      return parseProp(node.initializer)
    } else if (ts.isShorthandPropertyAssignment(node)) {
      const symbol = typeChecker.getShorthandAssignmentValueSymbol(node)
      if (!symbol || !symbol.valueDeclaration) {
        throw new ParseError(
          `Unsupported syntax for service config prop ${name} (1)`,
          node,
        )
      }
      return parseProp(symbol.valueDeclaration)
    } else if (ts.isVariableDeclaration(node) && node.initializer) {
      return parseProp(node.initializer)
    } else if (ts.isIdentifier(node)) {
      const symbol = resolveSymbol(node, typeChecker)
      if (!symbol || !symbol.valueDeclaration) {
        throw new ParseError(
          `Unsupported syntax for service config prop ${name} (2)`,
          node,
        )
      }
      return parseProp(symbol.valueDeclaration)
    }
    throw new ParseError(
      `Unsupported syntax for service config prop ${name} (3)`,
      node,
    )
  }
}

function parseFunctionConfigMiddlewares(
  configObject: ts.ObjectLiteralExpression,
  name: string,
  typeChecker: ts.TypeChecker,
): ts.FunctionLikeDeclarationBase[] | undefined {
  const prop = configObject.properties.find((p) => p.name?.getText() === name)

  if (!prop) {
    return undefined
  }

  const middlewareArrayLiteralExpr = getFirstChildOfKind(
    prop,
    ts.SyntaxKind.ArrayLiteralExpression,
  )

  if (
    !middlewareArrayLiteralExpr ||
    middlewareArrayLiteralExpr.elements.length === 0
  ) {
    return undefined
  }

  const functionDeclrs: ts.FunctionLikeDeclarationBase[] = []
  for (const middlewareArrayElement of middlewareArrayLiteralExpr.elements) {
    // we need getAliasedSymbol to resolve imports
    const symbol = resolveSymbol(middlewareArrayElement, typeChecker)
    if (symbol?.valueDeclaration) {
      if (ts.isFunctionDeclaration(symbol.valueDeclaration)) {
        functionDeclrs.push(symbol.valueDeclaration)
      } else if (
        ts.isVariableDeclaration(symbol.valueDeclaration) &&
        symbol.valueDeclaration.initializer &&
        ts.isArrowFunction(symbol.valueDeclaration.initializer)
      ) {
        functionDeclrs.push(symbol.valueDeclaration.initializer)
      }
    }
  }
  return functionDeclrs
}

export function mergeFunctionConfigs(
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
