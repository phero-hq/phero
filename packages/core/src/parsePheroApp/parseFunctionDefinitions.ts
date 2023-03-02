import ts from "typescript"
import parseFunctionDefinition from "./parseFunctionDefinition"
import { PheroFunction } from "../domain/PheroApp"
import { hasModifier, resolveSymbol } from "../lib/tsUtils"
import { DependencyMap } from "../generateModel"

export default function parseFunctionDefinitions(
  node: ts.Node | undefined,
  typeChecker: ts.TypeChecker,
  deps: DependencyMap,
): PheroFunction[] {
  if (!node) {
    return []
  }

  if (ts.isObjectLiteralExpression(node)) {
    const result: PheroFunction[] = []
    const propertyAssignments = node.properties
    for (const propertyAssignment of propertyAssignments) {
      const func = parseFunctionDefinition(
        propertyAssignment,
        typeChecker,
        deps,
      )
      result.push(func)
    }
    return result
  }

  if (ts.isIdentifier(node)) {
    const symbol = resolveSymbol(node, typeChecker)
    if (symbol) {
      return parseFunctionDefinitions(
        symbol.valueDeclaration,
        typeChecker,
        deps,
      )
    }
  }

  if (ts.isVariableDeclaration(node)) {
    return parseFunctionDefinitions(node.initializer, typeChecker, deps)
  }

  if (ts.isPropertyAccessExpression(node)) {
    return parseFunctionDefinitions(node.getLastToken(), typeChecker, deps)
  }

  if (ts.isSourceFile(node)) {
    const result: PheroFunction[] = []
    for (const statement of node.statements) {
      if (hasModifier(statement, ts.SyntaxKind.ExportKeyword)) {
        if (ts.isVariableStatement(statement)) {
          for (const varDeclr of statement.declarationList.declarations) {
            const func = parseFunctionDefinition(varDeclr, typeChecker, deps)
            result.push(func)
          }
        } else {
          return []
        }
      }
    }
    return result
  }

  return []
}
