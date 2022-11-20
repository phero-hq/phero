import ts from "typescript"
import { ParseError } from "../domain/errors"
import { PheroMiddlewareConfig } from "./domain"
import {
  getFirstChildOfKind,
  getNameAsString,
  getTypeName,
  resolveSymbol,
} from "../lib/tsUtils"
import * as tsx from "../tsx"

export default function parseServiceMiddlewareConfig(
  configObject: ts.ObjectLiteralExpression,
  name: string,
  prog: ts.Program,
): PheroMiddlewareConfig[] | undefined {
  const typeChecker = prog.getTypeChecker()
  const prop = configObject.properties.find(
    (p) => p.name && getNameAsString(p.name) === name,
  )

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

  const functionDeclrs: PheroMiddlewareConfig[] = []
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
): PheroMiddlewareConfig {
  if (middleware.parameters.length !== 3) {
    throw new ParseError(
      `S129: Middleware should have three parameters "(params: PheroParams<P>, ctx: PheroContext<C>, next: PheroNextFunction<T>)"`,
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
    getTypeName(paramsType) !== "PheroParams"
  ) {
    throw new ParseError(
      `S130: Middleware params parameter has no or incorrect type, should be defined like "params: PheroParams<T>"`,
      paramsParam,
    )
  }

  return paramsType.typeArguments?.[0] ?? tsx.literal.type()
}

function parseContextType(contextParam: ts.ParameterDeclaration): ts.TypeNode {
  const contextType = contextParam.type

  if (
    !contextType ||
    !ts.isTypeReferenceNode(contextType) ||
    getTypeName(contextType) !== "PheroContext"
  ) {
    throw new ParseError(
      `S131: Middleware ctx parameter has no or incorrect type, should be defined like "ctx: PheroContext<T>"`,
      contextParam,
    )
  }

  return contextType.typeArguments?.[0] ?? tsx.literal.type()
}

function parseNextType(
  nextParam: ts.ParameterDeclaration,
): ts.TypeNode | undefined {
  const nextType = nextParam.type

  if (
    !nextType ||
    !ts.isTypeReferenceNode(nextType) ||
    getTypeName(nextType) !== "PheroNextFunction"
  ) {
    throw new ParseError(
      `S132: Middleware next parameter has no or incorrect type, should be defined like "next: PheroNextFunction<T>"`,
      nextParam,
    )
  }

  return nextType.typeArguments?.[0]
}
