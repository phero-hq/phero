import React from "react"
import ts from "typescript"
import { generateExpression, TSExpressionElement } from "./ts-expression"

export interface TSPropertyAssignment {
  name: string
  init: TSExpressionElement
  children?: undefined
}

export type TSPropertyAssignmentElement = React.ReactElement<
  TSPropertyAssignment,
  "ts-property-assignment"
>

export function generatePropertyAssignment(
  element: TSPropertyAssignmentElement,
): ts.PropertyAssignment {
  return ts.factory.createPropertyAssignment(
    element.props.name,
    generateExpression(element.props.init),
  )
}
