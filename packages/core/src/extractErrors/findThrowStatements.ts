import ts from "typescript"
import { findCallExpressionsInStatement } from "./findCallExpressions"
import findFunctionDeclaration from "./findFunctionDeclaration"
import getFunctionStatements from "./getFunctionStatements"

export default function findThrowStatements(
  todos: ts.Statement[],
  accum: ts.ThrowStatement[],
  typeChecker: ts.TypeChecker,
): ts.ThrowStatement[] {
  if (todos.length === 0) {
    const uniques: ts.ThrowStatement[] = []

    // TODO instead of deduplicating statements
    // we should memoize the functions we already parsed
    for (const statement of accum) {
      if (!uniques.includes(statement)) {
        uniques.push(statement)
      }
    }

    return uniques
  }

  const [currentStatement, ...rest] = todos

  const statementsFromCallExpressions = findCallExpressionsInStatement(
    currentStatement,
  )
    .flatMap((e) => findFunctionDeclaration(e, typeChecker))
    .flatMap((declr) => getFunctionStatements(declr, typeChecker))

  const newTodos = [...rest, ...statementsFromCallExpressions]

  if (ts.isThrowStatement(currentStatement)) {
    return findThrowStatements(
      newTodos,
      [...accum, currentStatement],
      typeChecker,
    )
  }

  if (ts.isBlock(currentStatement)) {
    return findThrowStatements(
      [...currentStatement.statements, ...newTodos],
      accum,
      typeChecker,
    )
  }

  if (ts.isIfStatement(currentStatement)) {
    return findThrowStatements(
      currentStatement.elseStatement
        ? [
            currentStatement.thenStatement,
            currentStatement.elseStatement,
            ...newTodos,
          ]
        : [currentStatement.thenStatement, ...newTodos],
      accum,
      typeChecker,
    )
  }

  if (ts.isIterationStatement(currentStatement, true)) {
    return findThrowStatements(
      [currentStatement.statement, ...newTodos],
      accum,
      typeChecker,
    )
  }

  if (ts.isWithStatement(currentStatement)) {
    return findThrowStatements(
      [currentStatement.statement, ...newTodos],
      accum,
      typeChecker,
    )
  }

  if (ts.isSwitchStatement(currentStatement)) {
    const statements: ts.Statement[] =
      currentStatement.caseBlock.clauses.flatMap((clause) => clause.statements)
    return findThrowStatements([...statements, ...newTodos], accum, typeChecker)
  }

  if (ts.isLabeledStatement(currentStatement)) {
    return findThrowStatements(
      [currentStatement.statement, ...newTodos],
      accum,
      typeChecker,
    )
  }

  if (ts.isTryStatement(currentStatement)) {
    const statements = [
      ...currentStatement.tryBlock.statements,
      ...(currentStatement.catchClause?.block.statements ?? []),
      ...(currentStatement.finallyBlock?.statements ?? []),
    ]
    return findThrowStatements([...statements, ...newTodos], accum, typeChecker)
  }

  return findThrowStatements(newTodos, accum, typeChecker)
}
