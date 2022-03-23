import ts from "typescript"

import { TSAny, TSAnyElement } from "./ts-any"
import { TSArray, TSArrayElement } from "./ts-array"
import { TSArrowFunction, TSArrowFunctionElement } from "./ts-arrow-function"
import { TSAwait, TSAwaitElement } from "./ts-await"
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
import {
  TSShorthandPropertyAssignment,
  TSShorthandPropertyAssignmentElement,
} from "./ts-shorthand-property-assignment"
import { TSString, TSStringElement } from "./ts-string"
import { TSStringLiteral, TSStringLiteralElement } from "./ts-string-literal"
import { TSTrue, TSTrueElement } from "./ts-true"
import {
  TSCatch,
  TSCatchElement,
  TSFinally,
  TSFinallyElement,
  TSTry,
  TSTryElement,
} from "./ts-try"
import { TSTypeReference, TSTypeReferenceElement } from "./ts-type-reference"
import { TSUndefined, TSUndefinedElement } from "./ts-undefined"
import { TSUnion, TSUnionElement } from "./ts-union"
import { UnsupportedElementSupportedError } from "./utils"

export type TSElements =
  | TSFunctionElement
  | TSParameterElement
  | TSImportElement
  | TSPropertyAssignmentElement
  | TSShorthandPropertyAssignmentElement
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
  | TSTryElement
  | TSCatchElement
  | TSFinallyElement
  | TSArrayElement
  | TSUnionElement
  | TSAwaitElement

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // declaration
      "ts-function": TSFunction
      "ts-parameter": TSParameter
      "ts-import": TSImport
      "ts-property-assignment": TSPropertyAssignment
      "ts-shorthand-property-assignment": TSShorthandPropertyAssignment

      // expression
      "ts-arrow-function": TSArrowFunction
      "ts-call-expression": TSCallExpression
      "ts-binary-expression": TSBinaryExpression
      "ts-property-access-expression": TSPropertyAccessExpression
      "ts-await": TSAwait

      // statement
      "ts-const": TSConst
      "ts-block": TSBlock
      "ts-if": TSIf
      "ts-return": TSReturn
      "ts-try": TSTry
      "ts-catch": TSCatch
      "ts-finally": TSFinally

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
      "ts-array": TSArray
      "ts-union": TSUnion

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
