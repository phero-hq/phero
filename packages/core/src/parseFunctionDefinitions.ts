import ts from "typescript"
import parseFunctionDefinition from "./parseFunctionDefinition"
import { ParsedSamenFunctionDefinition } from "./parseSamenApp"
import { hasModifier, resolveSymbol } from "./tsUtils"

export default function parseFunctionDefinitions(
  node: ts.Node | undefined,
  typeChecker: ts.TypeChecker,
): ParsedSamenFunctionDefinition[] {
  if (!node) {
    return []
  }

  if (ts.isObjectLiteralExpression(node)) {
    const result: ParsedSamenFunctionDefinition[] = []
    const propertyAssignments = node.properties
    for (const propertyAssignment of propertyAssignments) {
      const func = parseFunctionDefinition(propertyAssignment, typeChecker)
      result.push(func)
    }
    return result
  }

  if (ts.isIdentifier(node)) {
    const symbol = resolveSymbol(node, typeChecker)
    if (symbol) {
      return parseFunctionDefinitions(symbol.valueDeclaration, typeChecker)
    }
  }

  if (ts.isVariableDeclaration(node)) {
    return parseFunctionDefinitions(node.initializer, typeChecker)
  }

  if (ts.isPropertyAccessExpression(node)) {
    return parseFunctionDefinitions(node.getLastToken(), typeChecker)
  }

  if (ts.isSourceFile(node)) {
    const result: ParsedSamenFunctionDefinition[] = []
    for (const statement of node.statements) {
      if (hasModifier(statement, ts.SyntaxKind.ExportKeyword)) {
        if (ts.isVariableStatement(statement)) {
          for (const varDeclr of statement.declarationList.declarations) {
            const func = parseFunctionDefinition(varDeclr, typeChecker)
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
