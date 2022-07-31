import ts from "typescript"
import { ParseError } from "../errors"
import parseFunctionConfigMiddlewares from "./parseMiddlewares"
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
    const middleware = parseFunctionConfigMiddlewares(
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

function parseConfigNumberPropValue(
  configObject: ts.ObjectLiteralExpression,
  name: string,
  typeChecker: ts.TypeChecker,
): number | undefined {
  const prop = configObject.properties.find((p) => p.name?.getText() === name)
  if (!prop) {
    return undefined
  }

  return parseProp(prop)

  function parseProp(node: ts.Node): number | undefined {
    if (ts.isNumericLiteral(node)) {
      const value = Number.parseInt(node.getText(), 10)
      return value
    } else if (ts.isPropertyAssignment(node)) {
      return parseProp(node.initializer)
    } else if (ts.isShorthandPropertyAssignment(node)) {
      const symbol = typeChecker.getShorthandAssignmentValueSymbol(node)
      if (!symbol || !symbol.valueDeclaration) {
        throw new ParseError(
          `Unsupported syntax for service config prop ${name} (1)`,
          node,
        )
      }
      return parseProp(symbol.valueDeclaration)
    } else if (ts.isVariableDeclaration(node) && node.initializer) {
      return parseProp(node.initializer)
    } else if (ts.isIdentifier(node)) {
      const symbol = resolveSymbol(node, typeChecker)
      if (!symbol || !symbol.valueDeclaration) {
        throw new ParseError(
          `Unsupported syntax for service config prop ${name} (2)`,
          node,
        )
      }
      return parseProp(symbol.valueDeclaration)
    }
    throw new ParseError(
      `Unsupported syntax for service config prop ${name} (3)`,
      node,
    )
  }
}
