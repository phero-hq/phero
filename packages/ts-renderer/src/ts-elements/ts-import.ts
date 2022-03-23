import React from "react"
import ts from "typescript"

export interface TSImport {
  names: string[]
  module: string
}

export type TSImportElement = React.ReactElement<TSImport, "ts-import">

export function generateImport(element: TSImportElement): ts.ImportDeclaration {
  return ts.factory.createImportDeclaration(
    undefined,
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports(
        element.props.names.map((name) =>
          ts.factory.createImportSpecifier(
            false,
            undefined,
            ts.factory.createIdentifier(name),
          ),
        ),
      ),
    ),
    ts.factory.createStringLiteral(element.props.module),
    undefined,
  )
}
