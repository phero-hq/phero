import ts from "typescript"
import { NewPointer } from "./generateParserFromModel"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { NumberParserModel } from "./generateParserModel"

export default function generateNumberParser(
  pointer: NewPointer<NumberParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createTypeOfExpression(pointer.dataVarExpr),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createStringLiteral("number"),
    ),
    generatePushErrorExpressionStatement(pointer.errorPath, "not a number"),
    ts.factory.createIfStatement(
      ts.factory.createCallExpression(
        ts.factory.createIdentifier("isNaN"),
        undefined,
        [pointer.dataVarExpr],
      ),
      generatePushErrorExpressionStatement(pointer.errorPath, "invalid number"),
      assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
    ),
  )
}
