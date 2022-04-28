import ts from "typescript"
import parseThrowStatement, { ParsedError } from "./parseThrowStatement"
import recursivelyFindThrowStatements from "./recursivelyFindThrowStatements"

export default function extractErrors(
  functions: ts.FunctionLikeDeclarationBase[],
  typeChecker: ts.TypeChecker,
): ParsedError[] {
  const throwStatements = recursivelyFindThrowStatements(functions, typeChecker)
  const parsedErrors = throwStatements
    .map((st) => parseThrowStatement(st, typeChecker))
    .filter((x): x is ParsedError => !!x)
  return deduplicateErrors(parsedErrors)
}

function deduplicateErrors(parsedErrors: ParsedError[]): ParsedError[] {
  const result: ParsedError[] = []
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
