import ts from "typescript"
import { NewPointer } from "./generateParserFromModel"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { BooleanParserModel } from "./generateParserModel"
import { Pointer } from "./Pointers"
import { TSNode } from "./TSNode"

export default function generateBooleanParser(
  pointer: NewPointer<BooleanParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createTypeOfExpression(pointer.dataVarExpr),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createStringLiteral("boolean"),
    ),
    generatePushErrorExpressionStatement(pointer.errorPath, "not a boolean"),
    assignDataToResult(pointer.resultVarExpr, pointer.dataVarExpr),
  )
}
