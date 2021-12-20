import ts from "typescript"
import { generateParserFromModel, NewPointer } from "./generateParserFromModel"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
  generateTypeofIsObjectAndIsNotNullExpression,
} from "./generateParserLib"
import { ArrayParserModel, ParserModelType } from "./generateParserModel"
import { generateParserForNode } from "./parsers"
import { TSArrayElementNode, TSNode } from "./TSNode"

export function newGenereteArrayParser(
  pointer: NewPointer<ArrayParserModel>,
): ts.Statement {
  const it_name = ts.factory.createIdentifier(`it_${pointer.model.depth}`)

  return ts.factory.createIfStatement(
    generateTypeofIsObjectAndIsNotNullExpression(pointer.dataVarExpr),
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

export default function generateArrayValidator(
  arrayNode: TSNode,
  arrayElementNode: TSArrayElementNode,
): ts.Statement {
  return ts.factory.createIfStatement(
    generateTypeofIsObjectAndIsNotNullExpression(arrayNode.dataVarExpr),
    generatePushErrorExpressionStatement(arrayNode.errorPath, "not an array"),
    ts.factory.createBlock([
      assignDataToResult(
        arrayNode.resultVarExpr,
        ts.factory.createArrayLiteralExpression([], false),
      ),
      ts.factory.createForStatement(
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              ts.factory.createIdentifier(arrayElementNode.name),
              undefined,
              undefined,
              ts.factory.createNumericLiteral("0"),
            ),
          ],
          ts.NodeFlags.Let,
        ),
        ts.factory.createBinaryExpression(
          ts.factory.createIdentifier(arrayElementNode.name),
          ts.factory.createToken(ts.SyntaxKind.LessThanToken),
          ts.factory.createPropertyAccessExpression(
            arrayNode.dataVarExpr,
            ts.factory.createIdentifier("length"),
          ),
        ),
        ts.factory.createPostfixUnaryExpression(
          ts.factory.createIdentifier(arrayElementNode.name),
          ts.SyntaxKind.PlusPlusToken,
        ),
        // generateParserForNode(arrayElementNode),
        ts.factory.createBlock([]),
      ),
    ]),
  )
}
