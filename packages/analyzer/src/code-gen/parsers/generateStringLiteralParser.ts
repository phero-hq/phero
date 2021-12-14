import ts from "typescript"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { TSNode } from "./TSNode"

export default function generateStringLiteralParser(
  node: TSNode,
): ts.Statement {
  if (!node.type.isStringLiteral()) {
    throw new Error("Is not a StringLiteral")
  }

  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      node.dataVarExpr,
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createStringLiteral(node.type.value),
    ),
    generatePushErrorExpressionStatement(
      node.errorPath,
      `not '${node.type.value}'`,
    ),
    assignDataToResult(node.resultVarExpr, node.dataVarExpr),
  )
}
