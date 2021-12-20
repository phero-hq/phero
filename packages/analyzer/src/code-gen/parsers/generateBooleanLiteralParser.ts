import ts from "typescript"
import { NewPointer } from "./generateParserFromModel"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { BooleanLiteralParserModel } from "./generateParserModel"

export default function generateBooleanLiteralParser(
  pointer: NewPointer<BooleanLiteralParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      pointer.dataVarExpr,
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      pointer.model.literal
        ? ts.factory.createTrue()
        : ts.factory.createFalse(),
    ),
    generatePushErrorExpressionStatement(
      pointer.errorPath,
      pointer.model.literal ? `not true` : `not false`,
    ),
    assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
  )
}
