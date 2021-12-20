import ts from "typescript"
import { NewPointer } from "./generateParserFromModel"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { StringLiteralParserModel } from "./generateParserModel"

export default function generateStringLiteralParser(
  pointer: NewPointer<StringLiteralParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      pointer.dataVarExpr,
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createStringLiteral(pointer.model.literal),
    ),
    generatePushErrorExpressionStatement(
      pointer.errorPath,
      `not '${pointer.model.literal}'`,
    ),
    assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
  )
}
