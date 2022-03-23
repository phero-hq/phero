import React from "react"
import ts from "typescript"
import {
  generatePropertySignature,
  TSPropertySignatureElement,
} from "./ts-property-signature"

export interface TSTypeLiteral {
  children?: TSPropertySignatureElement | TSPropertySignatureElement[]
}

export type TSTypeLiteralElement = React.ReactElement<
  TSTypeLiteral,
  "ts-type-literal"
>

export function generateTypeLiteral(
  element: TSTypeLiteralElement,
): ts.TypeLiteralNode {
  const members = element.props.children
    ? React.Children.map<ts.PropertySignature, TSPropertySignatureElement>(
        element.props.children,
        generatePropertySignature,
      )
    : []

  return ts.factory.createTypeLiteralNode(members)
}
