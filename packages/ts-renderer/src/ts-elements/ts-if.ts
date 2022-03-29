import React from "react"
import ts from "typescript"
import { generateExpression, TSExpressionElement } from "./ts-expression"
import { generateStatement, TSStatementElement } from "./ts-statement"

export interface TSIf {
  expression: TSExpressionElement
  then: TSStatementElement
  else?: TSStatementElement
  children?: undefined
}

export type TSIfElement = React.ReactElement<TSIf, "ts-if">

export function generateIf(element: TSIfElement): ts.IfStatement {
  return ts.factory.createIfStatement(
    generateExpression(element.props.expression),
    generateStatement(element.props.then),
    element.props.else && generateStatement(element.props.else),
  )
}
