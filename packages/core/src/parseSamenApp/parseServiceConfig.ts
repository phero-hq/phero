import ts from "typescript"
import { ParseError } from "../errors"
import parseServiceMiddlewareConfig from "./parseServiceMiddlewareConfig"
import { ParsedSamenServiceConfig } from "./parseSamenApp"
import { resolveSymbol } from "../tsUtils"

export default function parseServiceConfig(
  node: ts.Node | undefined,
  typeChecker: ts.TypeChecker,
): ParsedSamenServiceConfig {
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

  throw new ParseError("Unsupport syntax for function config", node)
}