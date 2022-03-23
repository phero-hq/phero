import ts from "typescript"
import { generateAny, TSAny, TSAnyElement } from "./ts-any"
import { generateArray, TSArray, TSArrayElement } from "./ts-array"
import { generateBoolean, TSBoolean, TSBooleanElement } from "./ts-boolean"
import { TSImport } from "./ts-import"
import { generateNumber, TSNumber, TSNumberElement } from "./ts-number"
import { generateString, TSString, TSStringElement } from "./ts-string"
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

export type TSTypeElement =
  | TSAnyElement
  | TSTypeReferenceElement
  | TSBooleanElement
  | TSNumberElement
  | TSStringElement
  | TSUndefinedElement
  | TSArrayElement

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
    default:
      throw new UnsupportedElementSupportedError(element)
  }
}
