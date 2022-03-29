import ts from "typescript"
import { generateTypeNode, TSTypeElement } from "./ts-type"

export interface TSPropertySignature {
  optional?: boolean
  name: string
  type: TSTypeElement
  children?: undefined
}

export type TSPropertySignatureElement = React.ReactElement<
  TSPropertySignature,
  "ts-property-signature"
>

export function generatePropertySignature(
  element: TSPropertySignatureElement,
): ts.PropertySignature {
  return ts.factory.createPropertySignature(
    undefined,
    element.props.name,
    element.props.optional
      ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
      : undefined,
    generateTypeNode(element.props.type),
  )
}
