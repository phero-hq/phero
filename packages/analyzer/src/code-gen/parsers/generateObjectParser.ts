import ts from "typescript"
import generateArrayParser from "./generateArrayParser"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
  generateTypeofIsObjectAndIsNotNullExpression,
} from "./generateParserLib"
import { generateTypeElementParser } from "./generateTypeElementParser"
import {
  TSArrayElementNode,
  TSModelNode,
  TSNode,
  TSObjectNode,
  TSTypeElementNode,
} from "./TSNode"

export default function generateObjectParser(
  node: TSNode,
  parent?: TSNode,
): ts.Statement {
  if (!node.typeNode) {
    throw new Error("Required typeNode")
  }

  if (ts.isArrayTypeNode(node.typeNode)) {
    // const elementType = node.typeChecker.getTypeFromTypeNode(
    //   node.typeNode.elementType,
    // )
    const arrayElementNode = new TSArrayElementNode(
      node.typeNode.elementType,
      node.typeChecker,
      node,
    )
    return generateArrayParser(node, arrayElementNode)
  } else if (ts.isTypeLiteralNode(node.typeNode)) {
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
        ...node.typeNode.members.map((member) => {
          const subnode = new TSTypeElementNode(member, node.typeChecker, node)
          return generateTypeElementParser(subnode)
        }),
      ]),
    )
  } else if (
    ts.isInterfaceDeclaration(node.compilerNode) &&
    node instanceof TSModelNode
  ) {
    const objectNode = new TSObjectNode(
      node.compilerNode,
      node.typeChecker,
      node.name,
    )
    return ts.factory.createIfStatement(
      generateTypeofIsObjectAndIsNotNullExpression(objectNode.dataVarExpr),
      generatePushErrorExpressionStatement(
        objectNode.errorPath,
        "null or not an object",
      ),
      ts.factory.createBlock([
        assignDataToResult(
          node.resultVarExpr,
          ts.factory.createObjectLiteralExpression([], false),
        ),
        ...(objectNode.members.length
          ? objectNode.members.flatMap((member) => {
              const node = new TSTypeElementNode(
                member,
                objectNode.typeChecker,
                objectNode,
              )
              return generateTypeElementParser(node)
            })
          : []),
      ]),
    )
  } else if (ts.isTypeLiteralNode(node.compilerNode)) {
    throw new Error(`${node.typeNode.kind} IS TYPELITERALLLLLL`)
  } else {
    throw new Error(`${node.typeNode.kind} not an array`)
  }
}
