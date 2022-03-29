import React from "react"
import ts from "typescript"
import {
  generatePropertySignature,
  TSPropertySignatureElement,
} from "./ts-property-signature"
import { mapChildren } from "./utils"

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
  const members = mapChildren(element.props.children, generatePropertySignature)
  return ts.factory.createTypeLiteralNode(members)
}
