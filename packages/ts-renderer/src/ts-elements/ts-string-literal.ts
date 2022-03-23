import React from "react"
import ts from "typescript"

export interface TSStringLiteral {
  value: string
}

export type TSStringLiteralElement = React.ReactElement<
  TSStringLiteral,
  "ts-string-literal"
>

export function generateStringLiteral(
  element: TSStringLiteralElement,
): ts.StringLiteral {
  return ts.factory.createStringLiteral(element.props.value)
}
