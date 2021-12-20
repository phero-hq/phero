import ts, { Type } from "typescript"
import {
  assignDataToResult,
  generatePushErrorExpressionStatement,
  generateTypeofIsObjectAndIsNotNullExpression,
} from "./generateParserLib"
import { Pointer } from "./Pointers"
import { generateParserForNode } from "./parsers"
import { generateParserFromModel, NewPointer } from "./generateParserFromModel"
import { ObjectParserModel } from "./generateParserModel"

export function newGenereteObjectParser(
  pointer: NewPointer<ObjectParserModel>,
): ts.Statement {
  return ts.factory.createIfStatement(
    generateTypeofIsObjectAndIsNotNullExpression(pointer.dataVarExpr),
    generatePushErrorExpressionStatement(
      pointer.errorPath,
      "null or not an object",
    ),
    ts.factory.createBlock([
      assignDataToResult(
        pointer.resultVarExpr,
        ts.factory.createObjectLiteralExpression([], false),
      ),
      ...pointer.model.members.map((member) =>
        generateParserFromModel(member, pointer.path),
      ),
    ]),
  )
}

export default function generateObjectParser(node: Pointer): ts.Statement {
  const props = node.node.typeChecker.getPropertiesOfType(
    node.node.typeChecker.getTypeAtLocation(node.node.node),
  )
  var sts: ts.Statement[] = []
  for (const prop of props) {
    if (!prop.valueDeclaration) {
      continue
    }

    if (ts.isPropertySignature(prop.valueDeclaration)) {
      const propParser = generateParserForNode(
        node.withProperty(prop.valueDeclaration, prop.name),
      )

      if (prop.valueDeclaration.questionToken) {
        sts.push(
          ts.factory.createIfStatement(
            ts.factory.createBinaryExpression(
              node.dataVarExpr,
              ts.factory.createToken(
                ts.SyntaxKind.ExclamationEqualsEqualsToken,
              ),
              ts.factory.createIdentifier("undefined"),
            ),
            propParser,
          ),
        )
      } else {
        sts.push(propParser)
      }
    }
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
        ts.factory.createObjectLiteralExpression([], false),
      ),
      ...sts,
    ]),
  )

  // if (ts.isTupleTypeNode(node.typeNode)) {
  //   return generateTupleParser(node)
  // } else if (ts.isArrayTypeNode(node.typeNode)) {
  //   const arrayElementNode = new TSArrayElementNode(
  //     node.typeNode.elementType,
  //     node.typeChecker,
  //     node,
  //   )
  //   return generateArrayParser(node, arrayElementNode)
  // } else if (ts.isTypeLiteralNode(node.typeNode)) {
  //   return generatePojoParser(
  //     node,
  //     node.typeNode.members.map((m) => m),
  //   )
  // } else if (
  //   ts.isInterfaceDeclaration(node.compilerNode) &&
  //   node instanceof TSModelNode
  // ) {
  //   const objectNode = new TSObjectNode(
  //     node.compilerNode,
  //     node.typeChecker,
  //     node,
  //     node.name,
  //   )
  //   return generatePojoParser(objectNode, objectNode.members)
  // } else if (ts.isInterfaceDeclaration(node.compilerNode)) {
  //   throw new Error(`not implemented yet, referece to other parser`)
  // } else {
  //   throw new Error(`${node.typeNode.kind} not an object type`)
  // }
}

// function generatePojoParser(
//   node: TSNode,
//   members: ts.TypeElement[],
// ): ts.Statement {
//   return ts.factory.createIfStatement(
//     generateTypeofIsObjectAndIsNotNullExpression(node.dataVarExpr),
//     generatePushErrorExpressionStatement(
//       node.errorPath,
//       "null or not an object",
//     ),
//     ts.factory.createBlock([
//       assignDataToResult(
//         node.resultVarExpr,
//         ts.factory.createObjectLiteralExpression([], false),
//       ),
//       ...members.map((member) => {
//         const subnode = new TSTypeElementNode(member, node.typeChecker, node)
//         return generateTypeElementParser(subnode)
//       }),
//     ]),
//   )
// }
