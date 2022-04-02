import ts from "typescript"
import { generateModifiers } from "./lib"

export interface TypeAliasProps {
  export?: boolean
  name: string
  typeParameters?: ts.TypeParameterDeclaration[]
  type: ts.TypeNode
}

export function typeAlias(props: TypeAliasProps): ts.TypeAliasDeclaration {
  return ts.factory.createTypeAliasDeclaration(
    undefined,
    generateModifiers([props.export && ts.SyntaxKind.ExportKeyword]),
    props.name,
    props.typeParameters,
    props.type,
  )
}
