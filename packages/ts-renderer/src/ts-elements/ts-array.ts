import ts from "typescript"
import { generateTypeNode, TSTypeElement } from "./ts-type"

export interface TSArray {
  elementType: TSTypeElement
}

export type TSArrayElement = React.ReactElement<TSArray, "ts-array">

export function generateArray(element: TSArrayElement): ts.ArrayTypeNode {
  return ts.factory.createArrayTypeNode(
    generateTypeNode(element.props.elementType),
  )
}
