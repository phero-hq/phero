import React from "react"
import ts from "typescript"

export interface TSShorthandPropertyAssignment {
  name: string
  children?: undefined
}

export type TSShorthandPropertyAssignmentElement = React.ReactElement<
  TSShorthandPropertyAssignment,
  "ts-shorthand-property-assignment"
>

export function generateShorthandPropertyAssignment(
  element: TSShorthandPropertyAssignmentElement,
): ts.ShorthandPropertyAssignment {
  return ts.factory.createShorthandPropertyAssignment(element.props.name)
}
