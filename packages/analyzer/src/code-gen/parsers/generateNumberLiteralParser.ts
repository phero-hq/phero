import ts from "typescript"
import Pointer from "./Pointer"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { NumberLiteralParserModel } from "./generateParserModel"

export default function generateNumberLiteralParser(
  pointer: Pointer<NumberLiteralParserModel>,
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
}
