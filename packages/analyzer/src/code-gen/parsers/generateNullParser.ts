import ts from "typescript"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { TSNode } from "./TSNode"

export default function generateNullParser(node: TSNode): ts.Statement {
  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createTypeOfExpression(node.dataVarExpr),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createNull(),
    ),
    generatePushErrorExpressionStatement(node.errorPath, "not null"),
    assignDataToResult(node.resultVarExpr, node.dataVarExpr),
  )
}
