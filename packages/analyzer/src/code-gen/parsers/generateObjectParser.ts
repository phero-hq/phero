import ts, { Type } from "typescript"
import generateArrayParser from "./generateArrayParser"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
  generateTypeofIsObjectAndIsNotNullExpression,
} from "./generateParserLib"
import { generateTypeElementParser } from "./generateTypeElementParser"
import generateTupleParser from "./generateTupleParser"
import {
  TSArrayElementNode,
  TSModelNode,
  TSNode,
  TSObjectNode,
  TSTypeElementNode,
} from "./TSNode"

export default function generateObjectParser(node: TSNode): ts.Statement {
  if (ts.isTupleTypeNode(node.typeNode)) {
    return generateTupleParser(node)
  } else if (ts.isArrayTypeNode(node.typeNode)) {
    const arrayElementNode = new TSArrayElementNode(
      node.typeNode.elementType,
      node.typeChecker,
      node,
    )
    return generateArrayParser(node, arrayElementNode)
  } else if (ts.isTypeLiteralNode(node.typeNode)) {
    return generatePojoParser(
      node,
      node.typeNode.members.map((m) => m),
    )
  } else if (
    ts.isInterfaceDeclaration(node.compilerNode) &&
    node instanceof TSModelNode
  ) {
    const objectNode = new TSObjectNode(
      node.compilerNode,
      node.typeChecker,
      node,
      node.name,
    )
    return generatePojoParser(objectNode, objectNode.members)
  } else if (ts.isInterfaceDeclaration(node.compilerNode)) {
    throw new Error(`not implemented yet, referece to other parser`)
  } else {
    throw new Error(`${node.typeNode.kind} not an object type`)
  }
}

function generatePojoParser(
  node: TSNode,
  members: ts.TypeElement[],
): ts.Statement {
  return ts.factory.createIfStatement(
    generateTypeofIsObjectAndIsNotNullExpression(node.dataVarExpr),
    generatePushErrorExpressionStatement(
      node.errorPath,
      "null or not an object",
    ),
    ts.factory.createBlock([
      assignDataToResult(
        node.resultVarExpr,
        ts.factory.createObjectLiteralExpression([], false),
      ),
      ...members.map((member) => {
        const subnode = new TSTypeElementNode(member, node.typeChecker, node)
        return generateTypeElementParser(subnode)
      }),
    ]),
  )
}
