import ts from "typescript"
import { ParseError } from "./errors"
import { ParsedSamenFunctionConfig } from "./parseSamenApp"
import { parseConfigNumberPropValue } from "./parseServiceConfig"
import { resolveSymbol } from "./tsUtils"

export default function parseFunctionConfig(
  node: ts.Node | undefined,
  typeChecker: ts.TypeChecker,
): ParsedSamenFunctionConfig {
  if (!node) {
    return {}
  }

  if (ts.isObjectLiteralExpression(node)) {
    const memory = parseConfigNumberPropValue(node, "memory", typeChecker)
    const timeout = parseConfigNumberPropValue(node, "timeout", typeChecker)

    return { memory, timeout }
  }

  if (ts.isIdentifier(node)) {
    const symbol = resolveSymbol(node, typeChecker)
    if (symbol) {
      return parseFunctionConfig(symbol.valueDeclaration, typeChecker)
    }
  }

  if (ts.isVariableDeclaration(node)) {
    return parseFunctionConfig(node.initializer, typeChecker)
  }

  throw new ParseError("Unsupport syntax for function config", node)
}
