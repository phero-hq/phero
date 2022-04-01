import React from "react"
import ts from "typescript"
import { generateExpression, TSExpressionElement } from "./ts-expression"

export interface TSCallExpression {
  name: string
  args?: (string | TSExpressionElement)[]
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
    element.props.args?.map((arg) =>
      typeof arg === "string"
        ? ts.factory.createIdentifier(arg)
        : generateExpression(arg),
    ),
  )
}
