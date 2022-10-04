import ts from "typescript"
import { generateModifiers } from "./lib"

interface ParamDeclarationProps {
  private?: boolean
  public?: boolean
  readonly?: boolean
  name: string
  questionToken?: boolean
  type: ts.TypeNode
  children?: undefined
}

export function param(props: ParamDeclarationProps): ts.ParameterDeclaration {
  return ts.factory.createParameterDeclaration(
    generateModifiers([
      props.private && ts.SyntaxKind.PrivateKeyword,
      props.public && ts.SyntaxKind.PublicKeyword,
      props.readonly && ts.SyntaxKind.ReadonlyKeyword,
    ]),
    undefined,
    props.name,
    props.questionToken
      ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
      : undefined,
    props.type,
    undefined,
  )
}
