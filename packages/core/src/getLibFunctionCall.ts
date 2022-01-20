import ts from "typescript"
import { SamenLibFunctions } from "./parseSamenApp"
import { resolveSymbol } from "./tsUtils"

export default function getLibFunctionCall(
  node: ts.Node | undefined,
  typeChecker: ts.TypeChecker,
  libFunc: SamenLibFunctions,
): ts.CallExpression | undefined {
  if (!node) {
    return
  }

  if (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === libFunc.toString()
  ) {
    return node
  }

  if (ts.isPropertyAssignment(node)) {
    return getLibFunctionCall(node.initializer, typeChecker, libFunc)
  }

  if (ts.isIdentifier(node)) {
    const symbol = resolveSymbol(node, typeChecker)
    if (symbol) {
      return getLibFunctionCall(symbol.valueDeclaration, typeChecker, libFunc)
    }
  }

  if (ts.isVariableDeclaration(node)) {
    return getLibFunctionCall(node.initializer, typeChecker, libFunc)
  }

  if (ts.isPropertyAccessExpression(node)) {
    return getLibFunctionCall(node.getLastToken(), typeChecker, libFunc)
  }

  if (ts.isExportSpecifier(node)) {
    return getLibFunctionCall(
      node.propertyName ?? node.name,
      typeChecker,
      libFunc,
    )
  }

  if (ts.isShorthandPropertyAssignment(node)) {
    const symbol = typeChecker.getShorthandAssignmentValueSymbol(node)
    if (!symbol || !symbol.valueDeclaration) {
      return undefined
    }
    return getLibFunctionCall(symbol.valueDeclaration, typeChecker, libFunc)
  }
}
