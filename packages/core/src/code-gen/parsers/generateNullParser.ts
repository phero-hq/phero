import ts from "typescript"
import Pointer from "./Pointer"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { NullParserModel } from "./generateParserModel"

export default function generateNullParser(
  pointer: Pointer<NullParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    generateNullValidator(pointer),
    generatePushErrorExpressionStatement(pointer.errorPath, "not null"),
    assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
  )
}

function generateNullValidator(
  pointer: Pointer<NullParserModel>,
): ts.Expression {
  return ts.factory.createBinaryExpression(
    pointer.dataVarExpr,
    ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
    ts.factory.createNull(),
  )
}
