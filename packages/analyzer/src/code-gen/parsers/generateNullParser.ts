import ts from "typescript"
import { NewPointer } from "./generateParserFromModel"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { NullParserModel } from "./generateParserModel"

export default function generateNullParser(
  pointer: NewPointer<NullParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createTypeOfExpression(pointer.dataVarExpr),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createNull(),
    ),
    generatePushErrorExpressionStatement(pointer.errorPath, "not null"),
    assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
  )
}
