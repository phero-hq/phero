import ts from "typescript"
import { TSNode } from "./TSNode"

export function generateTypeofIsObjectAndIsNotNullExpression(
  exprOfVar: ts.Expression,
) {
  return ts.factory.createBinaryExpression(
    ts.factory.createBinaryExpression(
      ts.factory.createTypeOfExpression(exprOfVar),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createStringLiteral("object"),
    ),
    ts.factory.createToken(ts.SyntaxKind.BarBarToken),
    ts.factory.createBinaryExpression(
      exprOfVar,
      ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
      ts.factory.createNull(),
    ),
  )
}

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
