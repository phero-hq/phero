import ts from "typescript"
import { generateParserFromModel, NewPointer } from "./generateParserFromModel"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
  generateTypeofIsObjectAndIsNotNullExpression,
} from "./generateParserLib"
import { TupleParserModel } from "./generateParserModel"

export default function generateTupleParser(
  pointer: NewPointer<TupleParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    generateTypeofIsObjectAndIsNotNullExpression(pointer.dataVarExpr),
    generatePushErrorExpressionStatement(
      pointer.errorPath,
      "null or not an object",
    ),
    ts.factory.createBlock([
      assignDataToResult(
        pointer.resultVarExpr,
        ts.factory.createArrayLiteralExpression([], false),
      ),
      ...pointer.model.elements.map((element) =>
        generateParserFromModel(element, pointer.path),
      ),
    ]),
  )
}
