import ts from "typescript"

interface ImportProps {
  isTypeOnly?: boolean
  names: string[]
  module: string
}

export function importDeclaration(props: ImportProps): ts.ImportDeclaration {
  return ts.factory.createImportDeclaration(
    undefined,
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports(
        props.names.map((name) =>
          ts.factory.createImportSpecifier(
            props.isTypeOnly ?? false,
            undefined,
            ts.factory.createIdentifier(name),
          ),
        ),
      ),
    ),
    ts.factory.createStringLiteral(props.module),
    undefined,
  )
}
