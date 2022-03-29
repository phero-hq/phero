import React from "react"
import ts from "typescript"

export interface TSCallExpression {
  name: string
  args?: string[]
  children?: undefined
}

export type TSCallExpressionElement = React.ReactElement<
  TSCallExpression,
  "ts-call-expression"
>

export function generateCallExpression(
  element: TSCallExpressionElement,
): ts.CallExpression {
  return ts.factory.createCallExpression(
    ts.factory.createIdentifier(element.props.name),
    undefined,
    element.props.args?.map(ts.factory.createIdentifier),
  )
}
