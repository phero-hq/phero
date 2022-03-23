import ts from "typescript"
import { generateAny, TSAny, TSAnyElement } from "./ts-any"
import { generateArray, TSArray, TSArrayElement } from "./ts-array"
import { generateBoolean, TSBoolean, TSBooleanElement } from "./ts-boolean"
import { TSImport } from "./ts-import"
import {
  generateLiteralType,
  TSLiteralType,
  TSLiteralTypeElement,
} from "./ts-literal-type"
import { generateNumber, TSNumber, TSNumberElement } from "./ts-number"
import {
  generateNumberLiteral,
  TSNumberLiteral,
  TSNumberLiteralElement,
} from "./ts-number-literal"
import { generateString, TSString, TSStringElement } from "./ts-string"
import {
  generateStringLiteral,
  TSStringLiteral,
  TSStringLiteralElement,
} from "./ts-string-literal"
import {
  generateTypeLiteral,
  TSTypeLiteral,
  TSTypeLiteralElement,
} from "./ts-type-literal"
import {
  generateTypeReference,
  TSTypeReference,
  TSTypeReferenceElement,
} from "./ts-type-reference"
import {
  generateUndefined,
  TSUndefined,
  TSUndefinedElement,
} from "./ts-undefined"
import { generateUnion, TSUnion, TSUnionElement } from "./ts-union"
import { UnsupportedElementSupportedError } from "./utils"

export type TSType =
  | TSAny
  | TSTypeReference
  | TSBoolean
  | TSImport
  | TSNumber
  | TSString
  | TSUndefined
  | TSArray
  | TSUnion
  | TSLiteralType
  | TSNumberLiteral
  | TSStringLiteral
  | TSTypeLiteral

export type TSTypeElement =
  | TSAnyElement
  | TSTypeReferenceElement
  | TSBooleanElement
  | TSNumberElement
  | TSStringElement
  | TSUndefinedElement
  | TSArrayElement
  | TSUnionElement
  | TSLiteralTypeElement
  | TSNumberLiteralElement
  | TSStringLiteralElement
  | TSTypeLiteralElement

export function generateTypeNode(element: TSTypeElement): ts.TypeNode {
  switch (element.type) {
    case "ts-any":
      return generateAny()
    case "ts-type-reference":
      return generateTypeReference(element)
    case "ts-boolean":
      return generateBoolean()
    case "ts-number":
      return generateNumber()
    case "ts-string":
      return generateString()
    case "ts-undefined":
      return generateUndefined()
    case "ts-array":
      return generateArray(element)
    case "ts-union":
      return generateUnion(element)
    case "ts-literal-type":
      return generateLiteralType(element)
    case "ts-number-literal":
      return ts.factory.createLiteralTypeNode(generateNumberLiteral(element))
    case "ts-string-literal":
      return ts.factory.createLiteralTypeNode(generateStringLiteral(element))
    case "ts-type-literal":
      return generateTypeLiteral(element)
    default:
      throw new UnsupportedElementSupportedError(element)
  }
}
