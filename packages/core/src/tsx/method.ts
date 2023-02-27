import ts from "typescript"
import { generateModifiers } from "./lib"

interface MethodDeclarationProps {
  export?: boolean
  async?: boolean
  name: string
  params: ts.ParameterDeclaration[]
  returnType: ts.TypeNode
  typeParams?: ts.TypeParameterDeclaration[]
  body?: ts.Block | ts.Statement[]
}

export function method(props: MethodDeclarationProps): ts.MethodDeclaration {
  return ts.factory.createMethodDeclaration(
    generateModifiers([props.async && ts.SyntaxKind.AsyncKeyword]),
    undefined,
    props.name,
    undefined,
    props.typeParams,
    props.params,
    props.returnType,
    props.body && Array.isArray(props.body)
      ? ts.factory.createBlock(props.body)
      : props.body,
  )
}
