import React from "react"
import ts from "typescript"

export interface TSNumberLiteral {
  value: number
  children?: undefined
}

export type TSNumberLiteralElement = React.ReactElement<
  TSNumberLiteral,
  "ts-number-literal"
>

export function generateNumberLiteral(
  element: TSNumberLiteralElement,
): ts.NumericLiteral {
  return ts.factory.createNumericLiteral(element.props.value)
}
