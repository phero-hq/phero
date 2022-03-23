import ts from "typescript"
import { generateTypeNode, TSTypeElement } from "./ts-type"
import {
  generateTypeParameter,
  TSTypeParameterElement,
} from "./ts-type-parameter"
import { generateModifiers } from "./utils"

export interface TSTypeAlias {
  export?: boolean
  name: string
  typeParameters: TSTypeParameterElement[]
  type: TSTypeElement
}

export type TSTypeAliasElement = React.ReactElement<
  TSTypeAlias,
  "ts-type-alias"
>

export function generateTypeAlias(
  element: TSTypeAliasElement,
): ts.TypeAliasDeclaration {
  return ts.factory.createTypeAliasDeclaration(
    undefined,
    generateModifiers([element.props.export && ts.SyntaxKind.ExportKeyword]),
    element.props.name,
    element.props.typeParameters.map(generateTypeParameter),
    generateTypeNode(element.props.type),
  )
}
