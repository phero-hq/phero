import ts from "typescript"
import { PheroParseError } from "../domain/errors"
import { type PheroServiceConfig } from "../domain/PheroApp"
import { type DependencyMap } from "../generateModel"
import { resolveSymbol } from "../lib/tsUtils"
import parseServiceMiddlewareConfig from "./parseServiceMiddlewareConfig"

export default function parseServiceConfig(
  node: ts.Node | undefined,
  prog: ts.Program,
  deps: DependencyMap,
): PheroServiceConfig {
  if (!node) {
    return { middleware: [] }
  }

  if (ts.isObjectLiteralExpression(node)) {
    const middleware = parseServiceMiddlewareConfig(
      node,
      "middleware",
      prog.getTypeChecker(),
      deps,
    )

    return { middleware: middleware ?? [] }
  }

  if (ts.isIdentifier(node)) {
    const symbol = resolveSymbol(node, prog.getTypeChecker())
    if (symbol) {
      return parseServiceConfig(symbol.valueDeclaration, prog, deps)
    }
  }

  if (ts.isVariableDeclaration(node)) {
    return parseServiceConfig(node.initializer, prog, deps)
  }

  throw new PheroParseError("S126: Unsupport syntax for function config", node)
}
