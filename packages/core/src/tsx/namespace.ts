import ts from "typescript"
import { generateModifiers } from "./lib"

export function namespace(props: {
  name: string
  export?: boolean
  declare?: boolean
  statements: ts.Statement[]
}): ts.ModuleDeclaration {
  return ts.factory.createModuleDeclaration(
    generateModifiers([
      props.export && ts.SyntaxKind.ExportKeyword,
      props.declare && ts.SyntaxKind.DeclareKeyword,
    ]),
    ts.factory.createIdentifier(props.name),
    ts.factory.createModuleBlock(props.statements),
    ts.NodeFlags.Namespace,
  )
}
