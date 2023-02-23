import ts from "typescript"
import { PheroMiddlewareConfig } from "../domain/PheroApp"
import {
  DependencyMap,
  generateParserModelForMiddleware,
} from "../generateModel"

import {
  getFirstChildOfKind,
  getNameAsString,
  resolveSymbol,
} from "../lib/tsUtils"

export default function parseServiceMiddlewareConfig(
  configObject: ts.ObjectLiteralExpression,
  name: string,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): PheroMiddlewareConfig[] | undefined {
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
        const parserModel = generateParserModelForMiddleware(
          middleware,
          typeChecker,
          deps,
        )
        functionDeclrs.push({ middleware, ...parserModel })
      } else if (
        ts.isVariableDeclaration(symbol.valueDeclaration) &&
        symbol.valueDeclaration.initializer &&
        ts.isArrowFunction(symbol.valueDeclaration.initializer)
      ) {
        const middleware = symbol.valueDeclaration.initializer
        const parserModel = generateParserModelForMiddleware(
          middleware,
          typeChecker,
          deps,
        )
        functionDeclrs.push({ middleware, ...parserModel })
      }
    }
  }
  return functionDeclrs
}
