import React from "react"
import ts from "typescript"
import {
  generatePropertyAssignment,
  TSPropertyAssignmentElement,
} from "./ts-property-assignment"
import {
  generateShorthandPropertyAssignment,
  TSShorthandPropertyAssignmentElement,
} from "./ts-shorthand-property-assignment"

export interface TSObjectLiteral {
  children: TSPropertyElement | TSPropertyElement[]
}

export type TSObjectLiteralElement = React.ReactElement<
  TSObjectLiteral,
  "ts-object-literal"
>

export function generateObjectLiteral(
  element: TSObjectLiteralElement,
): ts.ObjectLiteralExpression {
  const elements = React.Children.map<
    ts.ObjectLiteralElementLike,
    TSPropertyElement
  >(element.props.children, generateProperty)
  return ts.factory.createObjectLiteralExpression(elements)
}

type TSPropertyElement =
  | TSPropertyAssignmentElement
  | TSShorthandPropertyAssignmentElement

function generateProperty(
  element: TSPropertyElement,
): ts.ObjectLiteralElementLike {
  switch (element.type) {
    case "ts-property-assignment":
      return generatePropertyAssignment(element)
    case "ts-shorthand-property-assignment":
      return generateShorthandPropertyAssignment(element)
  }
}
