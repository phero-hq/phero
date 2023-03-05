import ts from "typescript"
import { resolveSymbol } from "../lib/tsUtils"

export default function parseCreateServiceCallExpression(
  node: ts.Node | undefined,
  prog: ts.Program,
): ts.CallExpression | undefined {
  const typeChecker = prog.getTypeChecker()

  if (!node) {
    return
  }

  if (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "createService"
  ) {
    return node
  }

  if (ts.isPropertyAssignment(node)) {
    return parseCreateServiceCallExpression(node.initializer, prog)
  }

  if (ts.isIdentifier(node)) {
    const symbol = resolveSymbol(node, typeChecker)
    if (symbol) {
      return parseCreateServiceCallExpression(symbol.valueDeclaration, prog)
    }
  }

  if (ts.isVariableDeclaration(node)) {
    return parseCreateServiceCallExpression(node.initializer, prog)
  }

  if (ts.isPropertyAccessExpression(node)) {
    return parseCreateServiceCallExpression(node.getLastToken(), prog)
  }

  if (ts.isExportSpecifier(node)) {
    return parseCreateServiceCallExpression(
      node.propertyName ?? node.name,
      prog,
    )
  }

  if (ts.isShorthandPropertyAssignment(node)) {
    const symbol = typeChecker.getShorthandAssignmentValueSymbol(node)
    if (!symbol?.valueDeclaration) {
      return undefined
    }
    return parseCreateServiceCallExpression(symbol.valueDeclaration, prog)
  }
}
