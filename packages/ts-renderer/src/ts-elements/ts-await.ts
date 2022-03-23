import ts from "typescript"
import { generateExpression, TSExpressionElement } from "./ts-expression"

export interface TSAwait {
  children: TSExpressionElement
}

export type TSAwaitElement = React.ReactElement<TSAwait, "ts-await">

export function generateAwait(element: TSAwaitElement): ts.AwaitExpression {
  return ts.factory.createAwaitExpression(
    generateExpression(element.props.children),
  )
}
