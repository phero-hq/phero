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
import { mapChildren } from "./utils"

export interface TSObjectLiteral {
  children?: TSPropertyElement | TSPropertyElement[]
}

export type TSObjectLiteralElement = React.ReactElement<
  TSObjectLiteral,
  "ts-object-literal"
>

export function generateObjectLiteral(
  element: TSObjectLiteralElement,
): ts.ObjectLiteralExpression {
  const elements = mapChildren(element.props.children, generateProperty)
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
