import ts from "typescript"
import { generateModifiers } from "./lib"

interface ClassProps {
  name: string | ts.Identifier
  export?: boolean
  abstract?: boolean
  typeParams?: ts.TypeParameterDeclaration[]
  extendsType?: ts.ExpressionWithTypeArguments
  implementTypes?: ts.ExpressionWithTypeArguments[]
  elements?: ts.ClassElement[]
}

export function classDeclaration(props: ClassProps): ts.ClassDeclaration {
  return ts.factory.createClassDeclaration(
    generateModifiers([
      props.export && ts.SyntaxKind.ExportKeyword,
      props.abstract && ts.SyntaxKind.AbstractKeyword,
    ]),
    props.name,
    props.typeParams,
    getHeritageClauses(props),
    props.elements ? props.elements : [],
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
