import ts from "typescript"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
  generateTypeofIsObjectAndIsNotNullExpression,
} from "./generateParserLib"
import { generateParserForNode } from "./parsers"
import { TSNode, TSUnionElementNode } from "./TSNode"

export default function generateTupleParser(node: TSNode): ts.Statement {
  if (!node.typeNode || !ts.isTupleTypeNode(node.typeNode)) {
    throw new Error("Not a tuple type")
  }

  return ts.factory.createIfStatement(
    generateTypeofIsObjectAndIsNotNullExpression(node.dataVarExpr),
    generatePushErrorExpressionStatement(
      node.errorPath,
      "null or not an object",
    ),
    ts.factory.createBlock([
      assignDataToResult(
        node.resultVarExpr,
        ts.factory.createArrayLiteralExpression([], false),
      ),
      ...node.typeNode.elements.map((elementTypeNode, position) => {
        const subnode = new TSUnionElementNode(
          elementTypeNode,
          node.typeChecker,
          position,
          node,
        )
        return generateParserForNode(subnode)
      }),
    ]),
  )
}
