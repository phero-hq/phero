import ts from "typescript"
import Pointer from "./Pointer"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { BooleanParserModel } from "./generateParserModel"

export default function generateBooleanParser(
  pointer: Pointer<BooleanParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    generateBooleanValidator(pointer),
    generatePushErrorExpressionStatement(pointer.errorPath, "not a boolean"),
    assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
  )
}

function generateBooleanValidator(
  pointer: Pointer<BooleanParserModel>,
): ts.Expression {
  return ts.factory.createBinaryExpression(
    ts.factory.createTypeOfExpression(pointer.dataVarExpr),
    ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
    ts.factory.createStringLiteral("boolean"),
  )
}
