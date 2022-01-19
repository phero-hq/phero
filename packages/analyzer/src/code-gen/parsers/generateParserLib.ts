import ts from "typescript"

export function generatePushErrorExpressionStatement(
  errorPath: ts.Expression,
  message: string,
): ts.Statement {
  return ts.factory.createBlock(
    [
      ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier("errors"),
            ts.factory.createIdentifier("push"),
          ),
          undefined,
          [
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createPropertyAssignment(
                  ts.factory.createIdentifier("path"),
                  errorPath,
                ),
                ts.factory.createPropertyAssignment(
                  ts.factory.createIdentifier("message"),
                  ts.factory.createNoSubstitutionTemplateLiteral(message),
                ),
              ],
              true,
            ),
          ],
        ),
      ),
    ],
    true,
  )
}

export function assignDataToResult(
  resultExpr: ts.Expression,
  dataExpr: ts.Expression,
): ts.Statement {
  return ts.factory.createExpressionStatement(
    ts.factory.createBinaryExpression(
      resultExpr,
      ts.factory.createToken(ts.SyntaxKind.EqualsToken),
      dataExpr,
    ),
  )
}

export function generateOr(
  left: ts.Expression,
  right: ts.Expression,
): ts.Expression {
  if (left.kind === ts.SyntaxKind.FalseKeyword) {
    return right
  }
  return ts.factory.createBinaryExpression(
    ts.factory.createParenthesizedExpression(left),
    ts.factory.createToken(ts.SyntaxKind.BarBarToken),
    ts.factory.createParenthesizedExpression(right),
  )
}

export function generateAnd(
  left: ts.Expression,
  right: ts.Expression,
): ts.Expression {
  if (left.kind === ts.SyntaxKind.TrueKeyword) {
    return right
  }

  return ts.factory.createBinaryExpression(
    ts.factory.createParenthesizedExpression(left),
    ts.factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
    ts.factory.createParenthesizedExpression(right),
  )
}
