import ts from "typescript"
import { resolveSymbol } from "./tsUtils"

export default function getCreateServiceCallExpression(
  node: ts.Node | undefined,
  typeChecker: ts.TypeChecker,
): ts.CallExpression | undefined {
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
    return getCreateServiceCallExpression(node.initializer, typeChecker)
  }

  if (ts.isIdentifier(node)) {
    const symbol = resolveSymbol(node, typeChecker)
    if (symbol) {
      return getCreateServiceCallExpression(
        symbol.valueDeclaration,
        typeChecker,
      )
    }
  }

  if (ts.isVariableDeclaration(node)) {
    return getCreateServiceCallExpression(node.initializer, typeChecker)
  }

  if (ts.isPropertyAccessExpression(node)) {
    return getCreateServiceCallExpression(node.getLastToken(), typeChecker)
  }

  if (ts.isExportSpecifier(node)) {
    return getCreateServiceCallExpression(
      node.propertyName ?? node.name,
      typeChecker,
    )
  }

  if (ts.isShorthandPropertyAssignment(node)) {
    const symbol = typeChecker.getShorthandAssignmentValueSymbol(node)
    if (!symbol || !symbol.valueDeclaration) {
      return undefined
    }
    return getCreateServiceCallExpression(symbol.valueDeclaration, typeChecker)
  }
}
