import ts from "typescript"
import Pointer from "./Pointer"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { DateParserModel } from "./generateParserModel"

export default function generateDateParser(
  pointer: Pointer<DateParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    generateDateValidator(pointer),
    generatePushErrorExpressionStatement(pointer.errorPath, `is not a Date`),
    assignDataToResult(
      pointer.resultVarExpr,
      ts.factory.createNewExpression(
        ts.factory.createIdentifier("Date"),
        undefined,
        [pointer.dataVarExpr],
      ),
    ),
  )
}

function generateDateValidator(
  pointer: Pointer<DateParserModel>,
): ts.Expression {
  return ts.factory.createBinaryExpression(
    ts.factory.createBinaryExpression(
      ts.factory.createTypeOfExpression(pointer.dataVarExpr),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createStringLiteral("string"),
    ),
    ts.factory.createToken(ts.SyntaxKind.BarBarToken),
    ts.factory.createPrefixUnaryExpression(
      ts.SyntaxKind.ExclamationToken,
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          pointer.dataVarExpr,
          ts.factory.createIdentifier("match"),
        ),
        undefined,
        [
          ts.factory.createRegularExpressionLiteral(
            "/^d{4}-d{2}-d{2}Td{2}:d{2}:d{2}.d{3}Z$/",
          ),
        ],
      ),
    ),
  )
}
