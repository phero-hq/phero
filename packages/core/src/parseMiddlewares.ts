import ts from "typescript"
import { ParseError } from "./errors"
import { ParsedMiddlewareConfig } from "./parseSamenApp"
import { getFirstChildOfKind, getTypeName, resolveSymbol } from "./tsUtils"

export default function parseFunctionConfigMiddlewares(
  configObject: ts.ObjectLiteralExpression,
  name: string,
  typeChecker: ts.TypeChecker,
): ParsedMiddlewareConfig[] | undefined {
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

  const functionDeclrs: ParsedMiddlewareConfig[] = []
  for (const middlewareArrayElement of middlewareArrayLiteralExpr.elements) {
    // we need getAliasedSymbol to resolve imports
    const symbol = resolveSymbol(middlewareArrayElement, typeChecker)
    if (symbol?.valueDeclaration) {
      if (ts.isFunctionDeclaration(symbol.valueDeclaration)) {
        const middleware = symbol.valueDeclaration
        functionDeclrs.push(parseMiddlewareConfig(middleware))
      } else if (
        ts.isVariableDeclaration(symbol.valueDeclaration) &&
        symbol.valueDeclaration.initializer &&
        ts.isArrowFunction(symbol.valueDeclaration.initializer)
      ) {
        const middleware = symbol.valueDeclaration.initializer
        functionDeclrs.push(parseMiddlewareConfig(middleware))
      }
    }
  }
  return functionDeclrs
}

function parseMiddlewareConfig(
  middleware: ts.FunctionLikeDeclarationBase,
): ParsedMiddlewareConfig {
  if (middleware.parameters.length != 3) {
    throw new ParseError(
      `Middleware should have three parameters "(params: SamenParams<P>, ctx: SamenContext<C>, next: NextFunction<T>)"`,
      middleware,
    )
  }

  const [paramsParam, contextParam, nextParam] = middleware.parameters

  return {
    paramsType: parseParamsType(paramsParam),
    contextType: parseContextType(contextParam),
    nextType: parseNextType(nextParam),
    middleware,
  }
}

function parseParamsType(paramsParam: ts.ParameterDeclaration): ts.TypeNode {
  const paramsType = paramsParam.type

  if (
    !paramsType ||
    !ts.isTypeReferenceNode(paramsType) ||
    getTypeName(paramsType) !== "SamenParams" ||
    !paramsType.typeArguments?.[0]
  ) {
    throw new ParseError(
      `Middleware params parameter has no or incorrect type, should be defined like "params: SamenParams<T>"`,
      paramsParam,
    )
  }

  return paramsType.typeArguments?.[0]
}

function parseNextType(nextParam: ts.ParameterDeclaration): ts.TypeNode {
  const nextType = nextParam.type

  if (
    !nextType ||
    !ts.isTypeReferenceNode(nextType) ||
    getTypeName(nextType) !== "NextFunction" ||
    !nextType.typeArguments?.[0]
  ) {
    throw new ParseError(
      `Middleware next parameter has no or incorrect type, should be defined like "next: NextFunction<T>"`,
      nextParam,
    )
  }

  return nextType.typeArguments?.[0]
}

function parseContextType(contextParam: ts.ParameterDeclaration): ts.TypeNode {
  const contextType = contextParam.type

  if (
    !contextType ||
    !ts.isTypeReferenceNode(contextType) ||
    getTypeName(contextType) !== "SamenContext" ||
    !contextType.typeArguments?.[0]
  ) {
    throw new ParseError(
      `Middleware ctx parameter has no or incorrect type, should be defined like "ctx: SamenContext<T>"`,
      contextParam,
    )
  }

  return contextType.typeArguments?.[0]
}
