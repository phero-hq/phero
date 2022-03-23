import React from "react"
import ts from "typescript"
import {
  generatePropertyAssignment,
  TSPropertyAssignmentElement,
} from "./ts-property-assignment"

export interface TSObjectLiteral {
  children: TSPropertyAssignmentElement | TSPropertyAssignmentElement[]
}

export type TSObjectLiteralElement = React.ReactElement<
  TSObjectLiteral,
  "ts-object-literal"
>

export function generateObjectLiteral(
  element: TSObjectLiteralElement,
): ts.ObjectLiteralExpression {
  const elements = React.Children.map<
    ts.PropertyAssignment,
    TSPropertyAssignmentElement
  >(element.props.children, generatePropertyAssignment)
  return ts.factory.createObjectLiteralExpression(elements)
}
