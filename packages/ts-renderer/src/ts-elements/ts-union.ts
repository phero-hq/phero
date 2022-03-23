import ts from "typescript"
import { generateTypeNode, TSTypeElement } from "./ts-type"

export interface TSUnion {
  types: TSTypeElement[]
}

export type TSUnionElement = React.ReactElement<TSUnion, "ts-union">

export function generateUnion(element: TSUnionElement): ts.UnionTypeNode {
  return ts.factory.createUnionTypeNode(
    element.props.types.map(generateTypeNode),
  )
}
