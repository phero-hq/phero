import ts from "typescript"
import Pointer from "./Pointer"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { UndefinedParserModel } from "./generateParserModel"

export default function generateUndefinedParser(
  pointer: Pointer<UndefinedParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    generateUndefinedValidator(pointer),
    generatePushErrorExpressionStatement(pointer.errorPath, "not undefined"),
    assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
  )
}

function generateUndefinedValidator(
  pointer: Pointer<UndefinedParserModel>,
): ts.Expression {
  return ts.factory.createBinaryExpression(
    ts.factory.createTypeOfExpression(pointer.dataVarExpr),
    ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
    ts.factory.createIdentifier("undefined"),
  )
}
