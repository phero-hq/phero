import ts from "typescript"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { TSNode } from "./TSNode"

export default function generateBooleanParser(node: TSNode): ts.Statement {
  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createTypeOfExpression(node.dataVarExpr),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createStringLiteral("boolean"),
    ),
    generatePushErrorExpressionStatement(node.errorPath, "not a boolean"),
    assignDataToResult(node.resultVarExpr, node.dataVarExpr),
  )
}
