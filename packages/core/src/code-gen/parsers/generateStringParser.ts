import ts from "typescript"
import Pointer from "./Pointer"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { StringParserModel } from "./generateParserModel"

export default function generateStringParser(
  pointer: Pointer<StringParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    generateStringValidator(pointer),
    generatePushErrorExpressionStatement(pointer.errorPath, "not a string"),
    assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
  )
}

export function generateStringValidator(
  pointer: Pointer<StringParserModel>,
): ts.Expression {
  return ts.factory.createBinaryExpression(
    ts.factory.createTypeOfExpression(pointer.dataVarExpr),
    ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
    ts.factory.createStringLiteral("string"),
  )
}
