import ts from "typescript"
import { findCallExpressionsInStatement } from "./findCallExpressions"
import findFunctionDeclaration from "./findFunctionDeclaration"
import findFunctionStatements from "./findFunctionStatements"

export default function recursivelyFindThrowStatements(
  functions: ts.FunctionLikeDeclarationBase | ts.FunctionLikeDeclarationBase[],
  prog: ts.Program,
): ts.ThrowStatement[] {
  return loop(Array.isArray(functions) ? functions : [functions], [], [])

  function loop(
    todos: ts.FunctionLikeDeclarationBase[],
    done: ts.FunctionLikeDeclarationBase[],
    accum: ts.ThrowStatement[],
  ): ts.ThrowStatement[] {
    if (todos.length === 0) {
      return accum
    }

    const [func, ...rest] = todos

    if (done.includes(func)) {
      return loop(rest, done, accum)
    }

    const allStatements = findFunctionStatements(func)
    const throwStatements = allStatements.filter(ts.isThrowStatement)

    const dependencies = allStatements
      .flatMap(findCallExpressionsInStatement)
      .flatMap((callExpr) => findFunctionDeclaration(callExpr, prog))

    return loop(
      [...rest, ...dependencies],
      [...done, func],
      [...accum, ...throwStatements],
    )
  }
}
