import ts from "typescript"

interface CaseClause {
  expression: ts.Expression | string
  statements: ts.Statement[]
}

interface DefaultClause {
  statements: ts.Statement[]
}

export function switchStatement({
  expression,
  cases,
  defaultCase,
}: {
  expression: string | ts.Expression
  cases: CaseClause[]
  defaultCase?: DefaultClause
}): ts.SwitchStatement {
  return ts.factory.createSwitchStatement(
    typeof expression === "string"
      ? ts.factory.createIdentifier(expression)
      : expression,
    ts.factory.createCaseBlock([
      ...cases.map(({ expression, statements }) =>
        ts.factory.createCaseClause(
          typeof expression === "string"
            ? ts.factory.createStringLiteral(expression)
            : expression,
          statements,
        ),
      ),
      ...(defaultCase
        ? [ts.factory.createDefaultClause(defaultCase.statements)]
        : []),
    ]),
  )
}
