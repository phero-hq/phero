import React from "react"
import ts from "typescript"
import { generateFalse, TSFalseElement } from "./ts-false"
import {
  generateNumberLiteral,
  TSNumberLiteralElement,
} from "./ts-number-literal"
import {
  generateStringLiteral,
  TSStringLiteralElement,
} from "./ts-string-literal"
import { generateTrue, TSTrueElement } from "./ts-true"
import { UnsupportedElementSupportedError } from "./utils"

export interface TSLiteralType {
  value:
    | TSStringLiteralElement
    | TSNumberLiteralElement
    | TSFalseElement
    | TSTrueElement
}

export type TSLiteralTypeElement = React.ReactElement<
  TSLiteralType,
  "ts-literal-type"
>

export function generateLiteralType(
  element: TSLiteralTypeElement,
): ts.LiteralTypeNode {
  switch (element.props.value.type) {
    case "ts-true":
      return ts.factory.createLiteralTypeNode(generateTrue())
    case "ts-false":
      return ts.factory.createLiteralTypeNode(generateFalse())
    case "ts-string-literal":
      return ts.factory.createLiteralTypeNode(
        generateStringLiteral(element.props.value),
      )
    case "ts-number-literal":
      return ts.factory.createLiteralTypeNode(
        generateNumberLiteral(element.props.value),
      )
    default:
      throw new UnsupportedElementSupportedError(element)
  }
}
