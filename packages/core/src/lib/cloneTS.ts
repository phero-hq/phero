import ts from "typescript"

export default function cloneTS<TNode extends ts.Node>(rootNode: TNode): TNode {
  const transformer =
    (context: ts.TransformationContext) => (rootNode: ts.Node) => {
      function visit(node: ts.Node): ts.Node {
        if (ts.isStringLiteral(node)) {
          return ts.factory.createStringLiteral(node.text)
        }
        if (ts.isNumericLiteral(node)) {
          return ts.factory.createNumericLiteral(node.text)
        }

        return ts.visitEachChild(node, visit, context)
      }
      return ts.visitNode(rootNode, visit)
    }

  return ts.transform(rootNode, [transformer]).transformed[0] as TNode
}
