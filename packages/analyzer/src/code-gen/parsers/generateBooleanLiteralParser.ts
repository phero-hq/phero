import ts from "typescript"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { TSNode } from "./TSNode"

export default function generateBooleanLiteralParser(
  node: TSNode,
): ts.Statement {
  if (
    !node.typeNode ||
    !ts.isLiteralTypeNode(node.typeNode) ||
    (node.typeNode.literal.kind !== ts.SyntaxKind.TrueKeyword &&
      node.typeNode.literal.kind !== ts.SyntaxKind.FalseKeyword)
  ) {
    throw new Error("Is not a BooleanLiteral")
  }

  const isTrue = node.typeNode.literal.kind === ts.SyntaxKind.TrueKeyword

  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      node.dataVarExpr,
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      isTrue ? ts.factory.createTrue() : ts.factory.createFalse(),
    ),
    generatePushErrorExpressionStatement(
      node.errorPath,
      isTrue ? `not true` : `not false`,
    ),
    assignDataToResult(node.resultVarExpr, node.dataVarExpr),
  )
}
