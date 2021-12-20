import ts from "typescript"
import { NewPointer } from "./generateParserFromModel"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { UndefinedParserModel } from "./generateParserModel"

export default function undefinedParser(
  pointer: NewPointer<UndefinedParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createTypeOfExpression(pointer.dataVarExpr),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createIdentifier("undefined"),
    ),
    generatePushErrorExpressionStatement(pointer.errorPath, "not undefined"),
    assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
  )
}
