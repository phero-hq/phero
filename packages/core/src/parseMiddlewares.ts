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
        functionDeclrs.push({
          nextType: parseNextType(middleware),
          contextType: parseCtxType(middleware),
          middleware,
        })
      } else if (
        ts.isVariableDeclaration(symbol.valueDeclaration) &&
        symbol.valueDeclaration.initializer &&
        ts.isArrowFunction(symbol.valueDeclaration.initializer)
      ) {
        const middleware = symbol.valueDeclaration.initializer
        functionDeclrs.push({
          nextType: parseNextType(middleware),
          contextType: parseCtxType(middleware),
          middleware,
        })
      }
    }
  }
  return functionDeclrs
}

function parseNextType(
  middleware: ts.FunctionLikeDeclarationBase,
): ts.TypeNode {
  const firstParam = middleware.parameters[0]

  if (!firstParam) {
    throw new ParseError(
      `Middleware should have two parameters "(next: NextFunction<T>, ctx: SamenContext<C>)"`,
      middleware,
    )
  }

  const firstParamType = firstParam.type

  if (
    !firstParamType ||
    !ts.isTypeReferenceNode(firstParamType) ||
    getTypeName(firstParamType) !== "NextFunction"
  ) {
    throw new ParseError(
      `Middleware next parameter has no type defined, should be defined like "next: NextFunction<T>"`,
      middleware,
    )
  }

  const typeNode = firstParamType.typeArguments?.[0]

  if (!typeNode) {
    throw new ParseError(
      `Middleware next parameter was not defined, should be defined like "next: NextFunction<T>"`,
      middleware,
    )
  }

  return typeNode
}

function parseCtxType(middleware: ts.FunctionLikeDeclarationBase): ts.TypeNode {
  const secondParam = middleware.parameters[1]

  if (!secondParam) {
    throw new ParseError(
      `Middleware should have two parameters "(next: NextFunction<T>, ctx: SamenContext<C>)"`,
      middleware,
    )
  }

  const secondParamType = secondParam.type

  if (
    !secondParamType ||
    !ts.isTypeReferenceNode(secondParamType) ||
    getTypeName(secondParamType) !== "SamenContext"
  ) {
    throw new ParseError(
      `Middleware ctx parameter has no type defined, should be defined like "ctx: SamenContext<T>"`,
      middleware,
    )
  }

  const typeNode = secondParamType.typeArguments?.[0]

  if (!typeNode) {
    throw new ParseError(
      `Middleware ctx parameter has no type defined, should be defined like "ctx: SamenContext<T>"`,
      middleware,
    )
  }

  return typeNode
}
