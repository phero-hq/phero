import React from "react"
import ts from "typescript"
import { generateExpression, TSExpressionElement } from "./ts-expression"

export interface TSReturn {
  expression: TSExpressionElement
  children?: undefined
}

export type TSReturnElement = React.ReactElement<TSReturn, "ts-return">

export function generateReturn(element: TSReturnElement): ts.ReturnStatement {
  return ts.factory.createReturnStatement(
    generateExpression(element.props.expression),
  )
}
