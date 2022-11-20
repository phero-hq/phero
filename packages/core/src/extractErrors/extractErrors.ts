import ts from "typescript"
import { PheroError } from "../domain/PheroApp"
import parseThrowStatement from "./parseThrowStatement"
import recursivelyFindThrowStatements from "./recursivelyFindThrowStatements"

export default function extractErrors(
  functions: ts.FunctionLikeDeclarationBase[],
  prog: ts.Program,
): PheroError[] {
  const throwStatements = recursivelyFindThrowStatements(functions, prog)
  const parsedErrors = throwStatements
    .map((st) => parseThrowStatement(st, prog))
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
