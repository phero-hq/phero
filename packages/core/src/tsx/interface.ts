import ts from "typescript"
import { generateModifiers } from "./lib"

export interface InterfaceProps {
  export?: boolean
  name: string
  typeParameters?: ts.TypeParameterDeclaration[]
  members: ts.PropertySignature[]
}

export function interfaceDeclaration(
  props: InterfaceProps,
): ts.InterfaceDeclaration {
  return ts.factory.createInterfaceDeclaration(
    generateModifiers([props.export && ts.SyntaxKind.ExportKeyword]),
    props.name,
    props.typeParameters,
    undefined, // TODO heritage
    props.members,
  )
}
