import React from "react"
import ts from "typescript"
import { generateTypeNode, TSTypeElement } from "./ts-type"

export interface TSTypeReference {
  name: string
  args?: TSTypeElement[]
  children?: undefined
}

export type TSTypeReferenceElement = React.ReactElement<
  TSTypeReference,
  "ts-type-reference"
>

export function generateTypeReference(
  element: TSTypeReferenceElement,
): ts.TypeReferenceNode {
  return ts.factory.createTypeReferenceNode(
    ts.factory.createIdentifier(element.props.name),
    element.props.args && element.props.args.map(generateTypeNode),
  )
}
