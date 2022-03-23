import ts from "typescript"
import {
  generateArrowFunction,
  TSArrowFunction,
  TSArrowFunctionElement,
} from "./ts-arrow-function"
import { generateAwait, TSAwait, TSAwaitElement } from "./ts-await"
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
import { generateNull, TSNull, TSNullElement } from "./ts-null"
import {
  generateNumberLiteral,
  TSNumberLiteral,
  TSNumberLiteralElement,
} from "./ts-number-literal"
import {
  generateObjectLiteral,
  TSObjectLiteral,
  TSObjectLiteralElement,
} from "./ts-object-literal"
import {
  generatePropertyAccessExpression,
  TSPropertyAccessExpression,
  TSPropertyAccessExpressionElement,
} from "./ts-property-access-expression"
import {
  TSPropertyAssignment,
  TSPropertyAssignmentElement,
} from "./ts-property-assignment"
import {
  generateStringLiteral,
  TSStringLiteral,
  TSStringLiteralElement,
} from "./ts-string-literal"
import { generateTrue, TSTrue, TSTrueElement } from "./ts-true"
import { TSUndefined, TSUndefinedElement } from "./ts-undefined"
import { UnsupportedElementSupportedError } from "./utils"

export type TSExpression =
  | TSArrowFunction
  | TSCallExpression
  | TSBinaryExpression
  | TSPropertyAccessExpression
  | TSFalse
  | TSTrue
  | TSObjectLiteral
  | TSPropertyAssignment
  | TSNumberLiteral
  | TSStringLiteral
  | TSNull
  | TSUndefined
  | TSAwait

export type TSExpressionElement =
  | TSArrowFunctionElement
  | TSCallExpressionElement
  | TSBinaryExpressionElement
  | TSPropertyAccessExpressionElement
  | TSFalseElement
  | TSTrueElement
  | TSObjectLiteralElement
  | TSPropertyAssignmentElement
  | TSNumberLiteralElement
  | TSStringLiteralElement
  | TSNullElement
  | TSUndefinedElement
  | TSAwaitElement

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
    case "ts-true":
      return generateTrue()
    case "ts-object-literal":
      return generateObjectLiteral(element)
    case "ts-number-literal":
      return generateNumberLiteral(element)
    case "ts-string-literal":
      return generateStringLiteral(element)
    case "ts-null":
      return generateNull()
    case "ts-undefined":
      return ts.factory.createIdentifier("undefined")
    case "ts-await":
      return generateAwait(element)
    default:
      throw new UnsupportedElementSupportedError(element)
  }
}
