import ts from "typescript"
import { PheroParseError } from "../domain/errors"
import parseServiceMiddlewareConfig from "./parseServiceMiddlewareConfig"
import { PheroServiceConfig } from "../domain/PheroApp"
import { resolveSymbol } from "../lib/tsUtils"
import { parseMiddlewareModels } from "./parseModels"
import { DependencyMap } from "../generateModel"

export default function parseServiceConfig(
  node: ts.Node | undefined,
  prog: ts.Program,
  deps: DependencyMap,
): PheroServiceConfig {
  if (!node) {
    return {}
  }

  if (ts.isObjectLiteralExpression(node)) {
    const middleware = parseServiceMiddlewareConfig(
      node,
      "middleware",
      prog.getTypeChecker(),
      deps,
    )

    const models = middleware && parseMiddlewareModels(middleware, prog)

    return { middleware, models }
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
