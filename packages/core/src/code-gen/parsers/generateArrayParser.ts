import ts from "typescript"
import generateParserFromModel from "./generateParserFromModel"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { ArrayParserModel } from "./generateParserModel"
import Pointer from "./Pointer"

export default function generateArrayParser(
  pointer: Pointer<ArrayParserModel>,
): ts.Statement {
  const it_name = ts.factory.createIdentifier(`it_${pointer.model.depth}`)

  return ts.factory.createIfStatement(
    generateIsArrayExpression(pointer),
    generatePushErrorExpressionStatement(pointer.errorPath, "not an array"),
    ts.factory.createBlock([
      assignDataToResult(
        pointer.resultVarExpr,
        ts.factory.createArrayLiteralExpression([], false),
      ),
      ts.factory.createForStatement(
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              it_name,
              undefined,
              undefined,
              ts.factory.createNumericLiteral("0"),
            ),
          ],
          ts.NodeFlags.Let,
        ),
        ts.factory.createBinaryExpression(
          it_name,
          ts.factory.createToken(ts.SyntaxKind.LessThanToken),
          ts.factory.createPropertyAccessExpression(
            pointer.dataVarExpr,
            ts.factory.createIdentifier("length"),
          ),
        ),
        ts.factory.createPostfixUnaryExpression(
          it_name,
          ts.SyntaxKind.PlusPlusToken,
        ),
        generateParserFromModel(pointer.model.element, pointer.path),
      ),
    ]),
  )
}

function generateIsArrayExpression(
  pointer: Pointer<ArrayParserModel>,
): ts.Expression {
  return ts.factory.createPrefixUnaryExpression(
    ts.SyntaxKind.ExclamationToken,
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier("Array"),
        ts.factory.createIdentifier("isArray"),
      ),
      undefined,
      [pointer.dataVarExpr],
    ),
  )
}
