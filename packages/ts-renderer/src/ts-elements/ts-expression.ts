import ts from "typescript"
import {
  generateArrowFunction,
  TSArrowFunction,
  TSArrowFunctionElement,
} from "./ts-arrow-function"
import {
  generateBinaryExpression,
  TSBinaryExpression,
  TSBinaryExpressionElement,
} from "./ts-binary-expression"
import {
  generateCallExpression,
  TSCallExpression,
  TSCallExpressionElement,
} from "./ts-call-expression"
import { generateFalse, TSFalse, TSFalseElement } from "./ts-false"
import {
  generatePropertyAccessExpression,
  TSPropertyAccessExpression,
  TSPropertyAccessExpressionElement,
} from "./ts-property-access-expression"
import { UnsupportedElementSupportedError } from "./utils"

export type TSExpression =
  | TSArrowFunction
  | TSCallExpression
  | TSBinaryExpression
  | TSPropertyAccessExpression
  | TSFalse

export type TSExpressionElement =
  | TSArrowFunctionElement
  | TSCallExpressionElement
  | TSBinaryExpressionElement
  | TSPropertyAccessExpressionElement
  | TSFalseElement

export function generateExpression(
  element: TSExpressionElement,
): ts.Expression {
  switch (element.type) {
    case "ts-arrow-function":
      return generateArrowFunction(element)
    case "ts-call-expression":
      return generateCallExpression(element)
    case "ts-binary-expression":
      return generateBinaryExpression(element)
    case "ts-property-access-expression":
      return generatePropertyAccessExpression(element)
    case "ts-false":
      return generateFalse()
    default:
      throw new UnsupportedElementSupportedError(element)
  }
}
