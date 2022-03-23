import ts from "typescript"
import { generateAny, TSAnyElement } from "./ts-any"
import {
  generateTypeReference,
  TSTypeReferenceElement,
} from "./ts-type-reference"
import { UnsupportedElementSupportedError } from "./utils"

export type TSTypeElement = TSAnyElement | TSTypeReferenceElement

export function generateTypeNode(element: TSTypeElement): ts.TypeNode {
  switch (element.type) {
    case "ts-any":
      return generateAny()
    case "ts-type-reference":
      return generateTypeReference(element)
    default:
      throw new UnsupportedElementSupportedError(element)
  }
}
