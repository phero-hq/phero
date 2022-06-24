import ts from "typescript"

interface Props {
  identifier: string | ts.Identifier
  module: string | ts.StringLiteral
}

export function exportNamespaceDeclaration(props: Props): ts.ExportDeclaration {
  const exportClause = ts.factory.createNamespaceExport(
    typeof props.identifier === "string"
      ? ts.factory.createIdentifier(props.identifier)
      : props.identifier,
  )

  const module =
    typeof props.module === "string"
      ? ts.factory.createStringLiteral(props.module)
      : props.module

  return ts.factory.createExportDeclaration(
    undefined,
    undefined,
    false,
    exportClause,
    module,
    undefined,
  )
}
