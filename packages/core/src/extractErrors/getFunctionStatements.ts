import ts from "typescript"
import { findCallExpressionsInExpression } from "./findCallExpressions"
import findFunctionDeclaration from "./findFunctionDeclaration"

export default function getFunctionStatements(
  func: ts.FunctionLikeDeclarationBase,
  typeChecker: ts.TypeChecker,
): ts.Statement[] {
  if (!func.body) {
    return []
  }
  if (ts.isBlock(func.body)) {
    return func.body.statements.map((s) => s)
  } else {
    return findCallExpressionsInExpression(func.body)
      .flatMap((e) => findFunctionDeclaration(e, typeChecker))
      .flatMap((declr) => getFunctionStatements(declr, typeChecker))
  }
}
