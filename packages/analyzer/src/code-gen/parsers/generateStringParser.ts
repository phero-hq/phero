import ts from "typescript"
import { NewPointer } from "./generateParserFromModel"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
} from "./generateParserLib"
import { StringParserModel } from "./generateParserModel"

export default function generateStringParser(
  node: NewPointer<StringParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createTypeOfExpression(node.dataVarExpr),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createStringLiteral("string"),
    ),
    generatePushErrorExpressionStatement(node.errorPath, "not a string"),
    assignDataToResult(node.resultVarExpr, node.dataVarExpr),
  )
}
