import ts from "typescript"
import { generateModifiers } from "./lib"

interface FunctionDeclarationProps {
  export?: boolean
  async?: boolean
  name: string
  params: ts.ParameterDeclaration[]
  returnType: ts.TypeNode
  body?: ts.Block | ts.Statement[]
}

export function functionDeclaration(
  props: FunctionDeclarationProps,
): ts.FunctionDeclaration {
  return ts.factory.createFunctionDeclaration(
    generateModifiers([
      props.export && ts.SyntaxKind.ExportKeyword,
      props.async && ts.SyntaxKind.AsyncKeyword,
    ]),
    undefined,
    props.name,
    undefined,
    props.params,
    props.returnType,
    props.body && Array.isArray(props.body)
      ? ts.factory.createBlock(props.body)
      : props.body,
  )
}
