import ts from "typescript"

interface Props {
  identifiers: (string | ts.Identifier)[]
  module: string | ts.StringLiteral
}

export function exportDeclaration(props: Props): ts.ExportDeclaration {
  const exportClause = ts.factory.createNamedExports(
    props.identifiers.map((identifier) => {
      return ts.factory.createExportSpecifier(
        false,
        undefined,
        typeof identifier === "string"
          ? ts.factory.createIdentifier(identifier)
          : identifier,
      )
    }),
  )

  const module =
    typeof props.module === "string"
      ? ts.factory.createStringLiteral(props.module)
      : props.module

  return ts.factory.createExportDeclaration(
    undefined,
    false,
    exportClause,
    module,
    undefined,
  )
}
