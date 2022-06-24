import ts from "typescript"
import { generateModifiers } from "./lib"

interface ClassProps {
  name: string | ts.Identifier
  export?: boolean
  typeParams?: ts.TypeParameterDeclaration[]
  constructor?: ts.ConstructorDeclaration
  properties?: ts.PropertyDeclaration[]
  extendsType?: ts.ExpressionWithTypeArguments
  implementTypes?: ts.ExpressionWithTypeArguments[]
}

export function classDeclaration(props: ClassProps): ts.ClassDeclaration {
  return ts.factory.createClassDeclaration(
    undefined,
    generateModifiers([props.export && ts.SyntaxKind.ExportKeyword]),
    props.name,
    props.typeParams,
    getHeritageClauses(props),
    [
      ...(props.constructor ? [props.constructor] : []),
      ...(props.properties ?? []),
    ],
  )
}

function getHeritageClauses({
  extendsType,
  implementTypes,
}: ClassProps): ts.HeritageClause[] | undefined {
  const result: ts.HeritageClause[] = []

  if (extendsType) {
    result.push(
      ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
        extendsType,
      ]),
    )
  }

  if (implementTypes?.length) {
    result.push(
      ts.factory.createHeritageClause(
        ts.SyntaxKind.ImplementsKeyword,
        implementTypes,
      ),
    )
  }

  if (result.length) {
    return result
  }

  return undefined
}
