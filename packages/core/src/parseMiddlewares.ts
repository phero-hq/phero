import ts from "typescript"
import { ParseError } from "./errors"
import { ParsedMiddlewareConfig } from "./parseSamenApp"
import { getFirstChildOfKind, resolveSymbol } from "./tsUtils"

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
          ctxType: parseCtxType(middleware),
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
          ctxType: parseCtxType(middleware),
          middleware,
        })
      }
    }
  }
  return functionDeclrs
}

function parseNextType(
  middleware: ts.FunctionLikeDeclarationBase,
): ts.TypeNode | undefined {
  const firstParam = middleware.parameters[0]

  if (!firstParam) {
    throw new ParseError(
      `Middleware should have at least one parameter "next: NextFunction<T>"`,
      middleware,
    )
  }

  const firstParamType = firstParam.type

  if (
    !firstParamType ||
    !ts.isTypeReferenceNode(firstParamType) ||
    getTypeName(firstParamType.typeName) !== "NextFunction"
  ) {
    throw new ParseError(
      `Middleware next parameter has no type defined, should be defined like "next: NextFunction<T>"`,
      middleware,
    )
  }

  return firstParamType.typeArguments?.[0]
}

function parseCtxType(
  middleware: ts.FunctionLikeDeclarationBase,
): ts.TypeNode | undefined {
  const secondParam = middleware.parameters[1]

  if (!secondParam) {
    return undefined
  }

  const secondParamType = secondParam.type

  if (
    !secondParamType ||
    !ts.isTypeReferenceNode(secondParamType) ||
    getTypeName(secondParamType.typeName) !== "SamenContext"
  ) {
    throw new ParseError(
      `Middleware ctx parameter has no type defined, should be defined like "ctx: SamenContext<T>"`,
      middleware,
    )
  }

  return secondParamType.typeArguments?.[0]
}

function getTypeName(typeName: ts.EntityName): string {
  return ts.isIdentifier(typeName) ? typeName.text : typeName.right.text
}
