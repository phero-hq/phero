import ts from "typescript"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { TSNode } from "./TSNode"

export default function generateNumberLiteralParser(
  node: TSNode,
): ts.Statement {
  if (!node.type.isNumberLiteral()) {
    throw new Error("Is not a NumberLiteral")
  }

  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      node.dataVarExpr,
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createNumericLiteral(node.type.value),
    ),
    generatePushErrorExpressionStatement(
      node.errorPath,
      `not ${node.type.value}`,
    ),
    assignDataToResult(node.resultVarExpr, node.dataVarExpr),
  )
}
