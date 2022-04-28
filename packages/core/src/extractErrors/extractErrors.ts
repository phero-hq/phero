import ts from "typescript"
import parseThrowStatement, { ParsedError } from "./parseThrowStatement"
import recursivelyFindThrowStatements from "./recursivelyFindThrowStatements"

export default function extractErrors(
  func: ts.FunctionLikeDeclarationBase,
  typeChecker: ts.TypeChecker,
): ParsedError[] {
  const throwStatements = recursivelyFindThrowStatements(func, typeChecker)
  const parsedErrors = throwStatements
    .map((st) => parseThrowStatement(st, typeChecker))
    .filter((x): x is ParsedError => !!x)
  return parsedErrors
}
