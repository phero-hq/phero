import ts from "typescript"
import parseThrowStatement, { PheroError } from "./parseThrowStatement"
import recursivelyFindThrowStatements from "./recursivelyFindThrowStatements"

export default function extractErrors(
  functions: ts.FunctionLikeDeclarationBase[],
  typeChecker: ts.TypeChecker,
): PheroError[] {
  const throwStatements = recursivelyFindThrowStatements(functions, typeChecker)
  const parsedErrors = throwStatements
    .map((st) => parseThrowStatement(st, typeChecker))
    .filter((x): x is PheroError => !!x)
  return deduplicateErrors(parsedErrors)
}

function deduplicateErrors(parsedErrors: PheroError[]): PheroError[] {
  const result: PheroError[] = []
  const done: ts.ClassDeclaration[] = []
  for (const parsedError of parsedErrors) {
    if (done.includes(parsedError.ref)) {
      continue
    }

    result.push(parsedError)
    done.push(parsedError.ref)
  }
  return result
}
