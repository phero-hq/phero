import ts from "typescript"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { TSNode } from "./TSNode"

export default function generateNumberParser(node: TSNode): ts.Statement {
  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createTypeOfExpression(node.dataVarExpr),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createStringLiteral("number"),
    ),
    generatePushErrorExpressionStatement(node.errorPath, "not a number"),
    ts.factory.createIfStatement(
      ts.factory.createCallExpression(
        ts.factory.createIdentifier("isNaN"),
        undefined,
        [node.dataVarExpr],
      ),
      generatePushErrorExpressionStatement(node.errorPath, "invalid number"),
      assignDataToResult(node.resultVarExpr, node.dataVarExpr),
    ),
  )
}
