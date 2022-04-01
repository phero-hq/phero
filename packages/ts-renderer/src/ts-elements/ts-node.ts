import ts from "typescript"

export interface TSNode {
  node: ts.Node
  children?: undefined
}

export type TSNodeElement = React.ReactElement<TSNode, "ts-node">

export function generateNode<TSpecializedNode extends ts.Node>(
  element: TSNodeElement,
  nodeTypeGuard: (node: ts.Node) => node is TSpecializedNode,
): TSpecializedNode {
  if (!nodeTypeGuard(element.props.node)) {
    throw new Error("Node is not a typeNode")
  }
  return element.props.node
}
