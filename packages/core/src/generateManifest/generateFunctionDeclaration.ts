import ts from "typescript"
import { PheroFunction } from "../domain/PheroApp"
import * as tsx from "../tsx"

export default function generateFunctionDeclaration(
  func: PheroFunction,
): ts.FunctionDeclaration {
  return tsx.function({
    name: func.name,
    params: [
      ...(func.contextParameterType
        ? [
            tsx.param({
              name: "context",
              type: tsx.type.reference({
                name: "phero.PheroContext",
                args: [withDomainVersionRef(func.contextParameterType)],
              }),
            }),
          ]
        : []),
      ...func.parameters2.map((param) =>
        tsx.param({
          name: param.name,
          questionToken: param.questionToken,
          type: withDomainVersionRef(param.type),
        }),
      ),
    ],
    returnType: tsx.type.reference({
      name: "Promise",
      args: [withDomainVersionRef(func.returnType)],
    }),
  })
}

function withDomainVersionRef<T extends ts.Node>(node: T): T {
  const transformer =
    <T extends ts.Node>(context: ts.TransformationContext) =>
    (rootNode: T) => {
      function visit(node: ts.Node): ts.Node {
        if (ts.isTypeReferenceNode(node)) {
          return tsx.type.reference({
            name: transformTypeReferenceNodeName(node.typeName),
            args: node.typeArguments?.map(withDomainVersionRef),
          })
        }
        return ts.visitEachChild(node, visit, context)
      }
      return ts.visitNode(rootNode, visit)
    }

  return ts.transform<T>(node, [transformer]).transformed[0]
}

function transformTypeReferenceNodeName(
  entityName: ts.EntityName,
): ts.EntityName {
  const mostRight = ts.isIdentifier(entityName) ? entityName : entityName.right

  return ts.factory.createQualifiedName(
    ts.factory.createQualifiedName(
      ts.factory.createIdentifier("domain"),
      ts.factory.createIdentifier("v_1_0_0"),
    ),
    mostRight,
  )
}
