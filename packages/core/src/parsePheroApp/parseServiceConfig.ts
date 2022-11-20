import ts from "typescript"
import { ParseError } from "../domain/errors"
import parseServiceMiddlewareConfig from "./parseServiceMiddlewareConfig"
import { PheroServiceConfig } from "./domain"
import { resolveSymbol } from "../lib/tsUtils"
import { parseMiddlewareModels } from "./parseModels"

export default function parseServiceConfig(
  node: ts.Node | undefined,
  prog: ts.Program,
): PheroServiceConfig {
  if (!node) {
    return {}
  }

  if (ts.isObjectLiteralExpression(node)) {
    const middleware = parseServiceMiddlewareConfig(node, "middleware", prog)

    const models = middleware && parseMiddlewareModels(middleware, prog)

    return { middleware, models }
  }

  if (ts.isIdentifier(node)) {
    const symbol = resolveSymbol(node, prog.getTypeChecker())
    if (symbol) {
      return parseServiceConfig(symbol.valueDeclaration, prog)
    }
  }

  if (ts.isVariableDeclaration(node)) {
    return parseServiceConfig(node.initializer, prog)
  }

  throw new ParseError("S126: Unsupport syntax for function config", node)
}
