import ts from "typescript"
import Pointer from "./Pointer"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { VoidParserModel } from "./generateParserModel"

export default function generateVoidParser(
  pointer: Pointer<VoidParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    generateVoidValidator(pointer),
    generatePushErrorExpressionStatement(pointer.errorPath, "not undefined"),
    assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
  )
}

function generateVoidValidator(
  pointer: Pointer<VoidParserModel>,
): ts.Expression {
  return ts.factory.createBinaryExpression(
    ts.factory.createTypeOfExpression(pointer.dataVarExpr),
    ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
    ts.factory.createStringLiteral("undefined"),
  )
}
