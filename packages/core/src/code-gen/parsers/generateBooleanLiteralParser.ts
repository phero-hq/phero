import ts from "typescript"
import Pointer from "./Pointer"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { BooleanLiteralParserModel } from "./generateParserModel"

export default function generateBooleanLiteralParser(
  pointer: Pointer<BooleanLiteralParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    generateBooleanLiteralValidator(pointer),
    generatePushErrorExpressionStatement(
      pointer.errorPath,
      pointer.model.literal ? `not true` : `not false`,
    ),
    assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
  )
}

function generateBooleanLiteralValidator(
  pointer: Pointer<BooleanLiteralParserModel>,
): ts.Expression {
  return ts.factory.createBinaryExpression(
    pointer.dataVarExpr,
    ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
    pointer.model.literal ? ts.factory.createTrue() : ts.factory.createFalse(),
  )
}
