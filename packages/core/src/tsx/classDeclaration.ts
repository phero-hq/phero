import ts from "typescript"
import { generateModifiers } from "./lib"

interface ClassProps {
  name: string | ts.Identifier
  export?: boolean
  typeParams?: ts.TypeParameterDeclaration[]
  constructor?: ts.ConstructorDeclaration
  properties?: ts.PropertyDeclaration[]
}

export function classDeclaration(props: ClassProps): ts.ClassDeclaration {
  return ts.factory.createClassDeclaration(
    undefined,
    generateModifiers([props.export && ts.SyntaxKind.ExportKeyword]),
    props.name,
    props.typeParams,
    undefined,
    [
      ...(props.constructor ? [props.constructor] : []),
      ...(props.properties ?? []),
    ],
  )
}
