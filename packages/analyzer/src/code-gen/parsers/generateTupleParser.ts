import ts from "typescript"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
  generateTypeofIsObjectAndIsNotNullExpression,
} from "./generateParserLib"
import { generateParserForNode } from "./parsers"
import { TSNode, TSTupleElementNode } from "./TSNode"

export default function generateTupleParser(node: TSNode): ts.Statement {
  if (!ts.isTupleTypeNode(node.typeNode)) {
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
        const subnode = new TSTupleElementNode(
          elementTypeNode,
          node.typeChecker,
          node,
          position,
        )
        return generateParserForNode(subnode)
      }),
    ]),
  )
}
