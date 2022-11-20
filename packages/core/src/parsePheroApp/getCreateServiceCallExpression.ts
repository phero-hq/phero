import ts from "typescript"
import { resolveSymbol } from "../lib/tsUtils"

export default function getCreateServiceCallExpression(
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
    return getCreateServiceCallExpression(node.initializer, prog)
  }

  if (ts.isIdentifier(node)) {
    const symbol = resolveSymbol(node, typeChecker)
    if (symbol) {
      return getCreateServiceCallExpression(symbol.valueDeclaration, prog)
    }
  }

  if (ts.isVariableDeclaration(node)) {
    return getCreateServiceCallExpression(node.initializer, prog)
  }

  if (ts.isPropertyAccessExpression(node)) {
    return getCreateServiceCallExpression(node.getLastToken(), prog)
  }

  if (ts.isExportSpecifier(node)) {
    return getCreateServiceCallExpression(node.propertyName ?? node.name, prog)
  }

  if (ts.isShorthandPropertyAssignment(node)) {
    const symbol = typeChecker.getShorthandAssignmentValueSymbol(node)
    if (!symbol || !symbol.valueDeclaration) {
      return undefined
    }
    return getCreateServiceCallExpression(symbol.valueDeclaration, prog)
  }
}
