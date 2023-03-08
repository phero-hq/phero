import type ts from "typescript"
import parseThrowStatement from "./parseThrowStatement"
import recursivelyFindThrowStatements from "./recursivelyFindThrowStatements"

export default function extractErrors(
  functions: ts.FunctionLikeDeclarationBase[],
  prog: ts.Program,
): ts.ClassDeclaration[] {
  const throwStatements = recursivelyFindThrowStatements(functions, prog)
  const errors = throwStatements
    .map((st) => parseThrowStatement(st, prog))
    .filter((x): x is ts.ClassDeclaration => !!x)
  return deduplicateErrors(errors)
}

function deduplicateErrors(
  errors: ts.ClassDeclaration[],
): ts.ClassDeclaration[] {
  const result: ts.ClassDeclaration[] = []
  for (const error of errors) {
    if (result.includes(error)) {
      continue
    }

    result.push(error)
  }
  return result
}
