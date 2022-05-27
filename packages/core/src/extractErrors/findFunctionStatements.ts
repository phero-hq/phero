import ts from "typescript"

export default function findFunctionStatements(
  func: ts.FunctionLikeDeclarationBase,
): ts.Statement[] {
  if (!func.body || !ts.isBlock(func.body)) {
    return []
  }

  return func.body.statements.flatMap((st) => findInnerStatements(st, []))
}

function findInnerStatements(
  statement: ts.Statement,
  accum: ts.Statement[],
): ts.Statement[] {
  const newAccum = [...accum, statement]

  if (ts.isBlock(statement)) {
    return statement.statements.reduce(
      (result, st) => findInnerStatements(st, result),
      newAccum,
    )
  }

  if (ts.isIfStatement(statement)) {
    const statements = statement.elseStatement
      ? [statement.thenStatement, statement.elseStatement]
      : [statement.thenStatement]
    return statements.reduce(
      (result, st) => findInnerStatements(st, result),
      newAccum,
    )
  }

  if (ts.isIterationStatement(statement, true)) {
    return findInnerStatements(statement.statement, newAccum)
  }

  if (ts.isWithStatement(statement)) {
    return findInnerStatements(statement.statement, newAccum)
  }

  if (ts.isSwitchStatement(statement)) {
    const statements: ts.Statement[] = statement.caseBlock.clauses.flatMap(
      (clause) => clause.statements,
    )
    return statements.reduce(
      (result, st) => findInnerStatements(st, result),
      newAccum,
    )
  }

  if (ts.isLabeledStatement(statement)) {
    return findInnerStatements(statement.statement, newAccum)
  }

  if (ts.isTryStatement(statement)) {
    const statements = [
      ...statement.tryBlock.statements,
      ...(statement.catchClause?.block.statements ?? []),
      ...(statement.finallyBlock?.statements ?? []),
    ]
    return statements.reduce(
      (result, st) => findInnerStatements(st, result),
      newAccum,
    )
  }

  return newAccum
}
