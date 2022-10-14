import ts from "typescript"
import { ParseError } from "../errors"
import parseServiceMiddlewareConfig from "./parseServiceMiddlewareConfig"
import { ParsedPheroServiceConfig } from "./parsePheroApp"
import { resolveSymbol } from "../tsUtils"

export default function parseServiceConfig(
  node: ts.Node | undefined,
  typeChecker: ts.TypeChecker,
): ParsedPheroServiceConfig {
  if (!node) {
    return {}
  }

  if (ts.isObjectLiteralExpression(node)) {
    const middleware = parseServiceMiddlewareConfig(
      node,
      "middleware",
      typeChecker,
    )

    return { middleware }
  }

  if (ts.isIdentifier(node)) {
    const symbol = resolveSymbol(node, typeChecker)
    if (symbol) {
      return parseServiceConfig(symbol.valueDeclaration, typeChecker)
    }
  }

  if (ts.isVariableDeclaration(node)) {
    return parseServiceConfig(node.initializer, typeChecker)
  }

  throw new ParseError("S126: Unsupport syntax for function config", node)
}
