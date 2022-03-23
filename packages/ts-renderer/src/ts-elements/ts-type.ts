import ts from "typescript"
import { generateAny, TSAny, TSAnyElement } from "./ts-any"
import { generateArray, TSArray, TSArrayElement } from "./ts-array"
import { generateBoolean, TSBoolean, TSBooleanElement } from "./ts-boolean"
import { TSImport, TSImportElement, generateImport } from "./ts-import"
import { TSNumber, TSNumberElement, generateNumber } from "./ts-number"
import { TSString, TSStringElement, generateString } from "./ts-string"
import {
  generateTypeReference,
  TSTypeReference,
  TSTypeReferenceElement,
} from "./ts-type-reference"
import {
  TSUndefined,
  TSUndefinedElement,
  generateUndefined,
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
