import React from "react"
import ts from "typescript"
import {
  generatePropertySignature,
  TSPropertySignatureElement,
} from "./ts-property-signature"
import {
  generateTypeParameter,
  TSTypeParameterElement,
} from "./ts-type-parameter"
import { generateModifiers } from "./utils"

export interface TSInterface {
  export?: boolean
  name: string
  typeParameters: TSTypeParameterElement[]
  children?: TSPropertySignatureElement | TSPropertySignatureElement[]
}

export type TSInterfaceElement = React.ReactElement<TSInterface, "ts-interface">

export function generateInterface(
  element: TSInterfaceElement,
): ts.InterfaceDeclaration {
  const members = element.props.children
    ? React.Children.map<ts.PropertySignature, TSPropertySignatureElement>(
        element.props.children,
        generatePropertySignature,
      )
    : []

  return ts.factory.createInterfaceDeclaration(
    undefined,
    generateModifiers([element.props.export && ts.SyntaxKind.ExportKeyword]),
    element.props.name,
    element.props.typeParameters.map(generateTypeParameter),
    undefined, // TODO heritage
    members,
  )
}
