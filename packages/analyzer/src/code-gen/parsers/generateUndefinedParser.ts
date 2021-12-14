import ts from "typescript"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { TSNode } from "./TSNode"

export default function generateUndefinedParser(node: TSNode): ts.Statement {
  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createTypeOfExpression(node.dataVarExpr),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createIdentifier("undefined"),
    ),
    generatePushErrorExpressionStatement(node.errorPath, "not undefined"),
    assignDataToResult(node.resultVarExpr, node.dataVarExpr),
  )
}
