import ts from "typescript"

import { TSAny, TSAnyElement } from "./ts-any"
import { TSArrowFunction, TSArrowFunctionElement } from "./ts-arrow-function"
import { TSBinaryExpression } from "./ts-binary-expression"
import { TSBlock, TSBlockElement } from "./ts-block"
import { TSCallExpression, TSCallExpressionElement } from "./ts-call-expression"
import { TSConst, TSConstElement } from "./ts-const"
import { TSFalse } from "./ts-false"
import { generateFunction, TSFunction, TSFunctionElement } from "./ts-function"
import { TSIf, TSIfElement } from "./ts-if"
import { TSParameter, TSParameterElement } from "./ts-parameter"
import {
  TSPropertyAccessExpression,
  TSPropertyAccessExpressionElement,
} from "./ts-property-access-expression"
import { TSReturn, TSReturnElement } from "./ts-return"
import { TSTypeReference, TSTypeReferenceElement } from "./ts-type-reference"
import { UnsupportedElementSupportedError } from "./utils"

export type TSElements =
  | TSAnyElement
  | TSArrowFunctionElement
  | TSConstElement
  | TSFunctionElement
  | TSParameterElement
  | TSTypeReferenceElement
  | TSBlockElement
  | TSCallExpressionElement
  | TSIfElement
  | TSPropertyAccessExpressionElement
  | TSReturnElement

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ts-function": TSFunction
      "ts-arrow-function": TSArrowFunction
      "ts-parameter": TSParameter
      "ts-const": TSConst
      "ts-any": TSAny
      "ts-type-reference": TSTypeReference
      "ts-block": TSBlock
      "ts-call-expression": TSCallExpression
      "ts-if": TSIf
      "ts-binary-expression": TSBinaryExpression
      "ts-property-access-expression": TSPropertyAccessExpression
      "ts-false": TSFalse
      "ts-return": TSReturn
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
