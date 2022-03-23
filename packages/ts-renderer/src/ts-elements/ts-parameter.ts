import ts from "typescript"
import { generateTypeNode, TSTypeElement } from "./ts-type"

export interface TSParameter {
  name: string
  questionToken?: boolean
  type: TSTypeElement
}

export type TSParameterElement = React.ReactElement<TSParameter, "ts-parameter">

export function generateParameter(
  element: TSParameterElement,
): ts.ParameterDeclaration {
  return ts.factory.createParameterDeclaration(
    undefined,
    undefined,
    undefined,
    element.props.name,
    element.props.questionToken
      ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
      : undefined,
    generateTypeNode(element.props.type),
    undefined,
  )
}
