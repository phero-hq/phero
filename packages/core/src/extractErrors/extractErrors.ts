import ts from "typescript"
import findThrowStatements from "./findThrowStatements"
import getFunctionStatements from "./getFunctionStatements"

export default function extractErrors(
  func: ts.FunctionLikeDeclarationBase,
  typeChecker: ts.TypeChecker,
): ts.ThrowStatement[] {
  const allThrowStatements = findThrowStatements(
    getFunctionStatements(func, typeChecker),
    [],
    typeChecker,
  )

  return allThrowStatements
}
