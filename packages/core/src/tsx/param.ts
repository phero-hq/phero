import ts from "typescript"

interface ParamDeclarationProps {
  name: string
  questionToken?: boolean
  type: ts.TypeNode
  children?: undefined
}

export function param(props: ParamDeclarationProps): ts.ParameterDeclaration {
  return ts.factory.createParameterDeclaration(
    undefined,
    undefined,
    undefined,
    props.name,
    props.questionToken
      ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
      : undefined,
    props.type,
    undefined,
  )
}
