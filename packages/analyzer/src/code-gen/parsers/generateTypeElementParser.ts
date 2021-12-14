import ts from "typescript"
import { generateParserForNode } from "./parsers"
import { TSTypeElementNode } from "./TSNode"

export function generateTypeElementParser(
  node: TSTypeElementNode,
): ts.Statement {
  const validationStatement = generateParserForNode(node)

  if (node.compilerNode.questionToken) {
    return ts.factory.createIfStatement(
      ts.factory.createBinaryExpression(
        node.dataVarExpr,
        ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
        ts.factory.createIdentifier("undefined"),
      ),
      validationStatement,
    )
  }

  return validationStatement
}
