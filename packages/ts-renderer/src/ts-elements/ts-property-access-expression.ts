import React from "react"
import ts from "typescript"

export interface TSPropertyAccessExpression {
  chain: string
}

export type TSPropertyAccessExpressionElement = React.ReactElement<
  TSPropertyAccessExpression,
  "ts-property-access-expression"
>

export function generatePropertyAccessExpression(
  element: TSPropertyAccessExpressionElement,
): ts.PropertyAccessExpression {
  function create(left: ts.Expression, right: string) {
    return ts.factory.createPropertyAccessExpression(left, right)
  }

  const [first, second, ...rest] = element.props.chain.split(".")
  if (!first || !second) {
    throw new Error("You need to give at minimum 2 xx")
  }
  return rest.reduce(create, create(ts.factory.createIdentifier(first), second))
}
