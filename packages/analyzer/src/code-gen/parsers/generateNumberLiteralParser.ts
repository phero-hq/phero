import ts from "typescript"
import { NewPointer } from "./generateParserFromModel"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { NumberLiteralParserModel } from "./generateParserModel"

export default function generateNumberLiteralParser(
  pointer: NewPointer<NumberLiteralParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      pointer.dataVarExpr,
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createNumericLiteral(pointer.model.literal),
    ),
    generatePushErrorExpressionStatement(
      pointer.errorPath,
      `not ${pointer.model.literal}`,
    ),
    assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
  )
  return ts.factory.createBlock([])
}
