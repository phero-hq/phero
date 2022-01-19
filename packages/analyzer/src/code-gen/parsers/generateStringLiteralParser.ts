import ts from "typescript"
import Pointer from "./Pointer"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { StringLiteralParserModel } from "./generateParserModel"

export default function generateStringLiteralParser(
  pointer: Pointer<StringLiteralParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    generateStringLiteralValidator(pointer),
    generatePushErrorExpressionStatement(
      pointer.errorPath,
      `not '${pointer.model.literal}'`,
    ),
    assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
  )
}

export function generateStringLiteralValidator(
  pointer: Pointer<StringLiteralParserModel>,
): ts.Expression {
  return ts.factory.createBinaryExpression(
    pointer.dataVarExpr,
    ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
    ts.factory.createStringLiteral(pointer.model.literal),
  )
}
