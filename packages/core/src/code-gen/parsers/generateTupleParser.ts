import ts from "typescript"
import generateParserFromModel from "./generateParserFromModel"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { TupleParserModel } from "./generateParserModel"
import Pointer from "./Pointer"

export default function generateTupleParser(
  pointer: Pointer<TupleParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    generateTupleValidator(pointer),
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

function generateTupleValidator(
  pointer: Pointer<TupleParserModel>,
): ts.Expression {
  return ts.factory.createBinaryExpression(
    ts.factory.createPrefixUnaryExpression(
      ts.SyntaxKind.ExclamationToken,
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier("Array"),
          ts.factory.createIdentifier("isArray"),
        ),
        undefined,
        [pointer.dataVarExpr],
      ),
    ),
    ts.factory.createToken(ts.SyntaxKind.BarBarToken),
    ts.factory.createBinaryExpression(
      ts.factory.createPropertyAccessExpression(
        pointer.dataVarExpr,
        ts.factory.createIdentifier("length"),
      ),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createNumericLiteral(pointer.model.elements.length),
    ),
  )
}
