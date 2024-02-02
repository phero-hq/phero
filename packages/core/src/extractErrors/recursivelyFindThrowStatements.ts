import ts from "typescript"
import { findCallExpressionsInStatement } from "./findCallExpressions"
import findFunctionDeclaration from "./findFunctionDeclaration"
import findFunctionStatements from "./findFunctionStatements"

export default function recursivelyFindThrowStatements(
  functions: ts.FunctionLikeDeclarationBase | ts.FunctionLikeDeclarationBase[],
  prog: ts.Program,
): ts.ThrowStatement[] {
  // This function would be prettier when using tail recursion, but that would
  // cause a stack overflow when processing large codebases since v8 does not
  // implement tail-call optimization.

  let todos: ts.FunctionLikeDeclarationBase[] = Array.isArray(functions)
    ? functions
    : [functions]
  let done: ts.FunctionLikeDeclarationBase[] = []
  let accum: ts.ThrowStatement[] = []

  while (todos.length > 0) {
    const [func, ...rest] = todos

    if (done.includes(func)) {
      todos = rest
      continue
    }

    const statements = findFunctionStatements(func)
    const throwStatements = statements.filter(ts.isThrowStatement)

    const dependencies = statements
      .flatMap(findCallExpressionsInStatement)
      .flatMap((callExpr) => findFunctionDeclaration(callExpr, prog))

    todos = [...rest, ...dependencies]
    done = [...done, func]
    accum = [...accum, ...throwStatements]
  }

  return accum
}
