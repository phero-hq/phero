import ts from "typescript"
import { generateTypeNode, TSTypeElement } from "./ts-type"

export interface TSTypeParameter {
  name: string
  // TODO constraint
  default?: TSTypeElement
}

export type TSTypeParameterElement = React.ReactElement<
  TSTypeParameter,
  "ts-type-parameter"
>

export function generateTypeParameter(
  element: TSTypeParameterElement,
): ts.TypeParameterDeclaration {
  return ts.factory.createTypeParameterDeclaration(
    element.props.name,
    undefined,
    element.props.default && generateTypeNode(element.props.default),
  )
}
