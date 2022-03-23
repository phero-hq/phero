import ts from "typescript"

import { TSAny, TSAnyElement } from "./ts-any"
import { TSArrowFunction, TSArrowFunctionElement } from "./ts-arrow-function"
import {
  TSBinaryExpression,
  TSBinaryExpressionElement,
} from "./ts-binary-expression"
import { TSBlock, TSBlockElement } from "./ts-block"
import { TSBoolean, TSBooleanElement } from "./ts-boolean"
import { TSCallExpression, TSCallExpressionElement } from "./ts-call-expression"
import { TSConst, TSConstElement } from "./ts-const"
import { TSFalse, TSFalseElement } from "./ts-false"
import { generateFunction, TSFunction, TSFunctionElement } from "./ts-function"
import { TSIf, TSIfElement } from "./ts-if"
import { TSImport, TSImportElement } from "./ts-import"
import { TSLiteralType, TSLiteralTypeElement } from "./ts-literal-type"
import { TSNull, TSNullElement } from "./ts-null"
import { TSNumber, TSNumberElement } from "./ts-number"
import { TSNumberLiteral, TSNumberLiteralElement } from "./ts-number-literal"
import { TSObjectLiteral } from "./ts-object-literal"
import { TSParameter, TSParameterElement } from "./ts-parameter"
import {
  TSPropertyAccessExpression,
  TSPropertyAccessExpressionElement,
} from "./ts-property-access-expression"
import {
  TSPropertyAssignment,
  TSPropertyAssignmentElement,
} from "./ts-property-assignment"
import { TSReturn, TSReturnElement } from "./ts-return"
import { TSString, TSStringElement } from "./ts-string"
import { TSStringLiteral, TSStringLiteralElement } from "./ts-string-literal"
import { TSTrue, TSTrueElement } from "./ts-true"
import { TSTypeReference, TSTypeReferenceElement } from "./ts-type-reference"
import { TSUndefined, TSUndefinedElement } from "./ts-undefined"
import { UnsupportedElementSupportedError } from "./utils"

export type TSElements =
  | TSFunctionElement
  | TSParameterElement
  | TSImportElement
  | TSPropertyAssignmentElement
  | TSArrowFunctionElement
  | TSCallExpressionElement
  | TSBinaryExpressionElement
  | TSPropertyAccessExpressionElement
  | TSConstElement
  | TSBlockElement
  | TSIfElement
  | TSReturnElement
  | TSFalseElement
  | TSTrueElement
  | TSTypeReferenceElement
  | TSAnyElement
  | TSBooleanElement
  | TSNumberElement
  | TSStringElement
  | TSUndefinedElement
  | TSLiteralTypeElement
  | TSStringLiteralElement
  | TSNumberLiteralElement
  | TSNullElement

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // declaration
      "ts-function": TSFunction
      "ts-parameter": TSParameter
      "ts-import": TSImport
      "ts-property-assignment": TSPropertyAssignment

      // expression
      "ts-arrow-function": TSArrowFunction
      "ts-call-expression": TSCallExpression
      "ts-binary-expression": TSBinaryExpression
      "ts-property-access-expression": TSPropertyAccessExpression

      // statement
      "ts-const": TSConst
      "ts-block": TSBlock
      "ts-if": TSIf
      "ts-return": TSReturn

      // literal
      "ts-false": TSFalse
      "ts-true": TSTrue

      // type-node
      "ts-type-reference": TSTypeReference
      "ts-any": TSAny
      "ts-boolean": TSBoolean
      "ts-number": TSNumber
      "ts-string": TSString
      "ts-undefined": TSUndefined
      "ts-literal-type": TSLiteralType
      // literals
      "ts-object-literal": TSObjectLiteral
      "ts-string-literal": TSStringLiteral
      "ts-number-literal": TSNumberLiteral
      "ts-null": TSNull
    }
  }
}

export function generateAST(element: TSElements): ts.Node {
  switch (element.type) {
    case "ts-function":
      return generateFunction(element)
    default:
      throw new UnsupportedElementSupportedError(element)
  }
}
