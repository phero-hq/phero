import ts from "typescript"
import generateParserFromModel from "./generateParserFromModel"
import Pointer from "./Pointer"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { ObjectParserModel } from "./generateParserModel"

export default function generateObjectParser(
  pointer: Pointer<ObjectParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    generateObjectValidator(pointer),
    generatePushErrorExpressionStatement(
      pointer.errorPath,
      "null or not an object",
    ),
    ts.factory.createBlock([
      assignDataToResult(
        pointer.resultVarExpr,
        ts.factory.createObjectLiteralExpression([], false),
      ),
      ...pointer.model.members.map((member) =>
        generateParserFromModel(member, pointer.path),
      ),
    ]),
  )
}

function generateObjectValidator(
  pointer: Pointer<ObjectParserModel>,
): ts.BinaryExpression {
  return ts.factory.createBinaryExpression(
    ts.factory.createBinaryExpression(
      ts.factory.createTypeOfExpression(pointer.dataVarExpr),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createStringLiteral("object"),
    ),
    ts.factory.createToken(ts.SyntaxKind.BarBarToken),
    ts.factory.createBinaryExpression(
      pointer.dataVarExpr,
      ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
      ts.factory.createNull(),
    ),
  )
}
