import ts from "typescript"

export function namespace(props: {
  name: string
  export?: boolean
  statements: ts.Statement[]
}): ts.ModuleDeclaration {
  return ts.factory.createModuleDeclaration(
    undefined,
    props.export
      ? [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)]
      : undefined,
    ts.factory.createIdentifier(props.name),
    ts.factory.createModuleBlock(props.statements),
    ts.NodeFlags.Namespace,
  )
}
