import ts from "typescript"

interface ConstProps {
  name: string
  type?: ts.TypeNode
  init?: ts.Expression
}

export function constDeclaration(props: ConstProps): ts.VariableStatement {
  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          props.name,
          undefined,
          props.type,
          props.init,
        ),
      ],
      ts.NodeFlags.Const |
        ts.NodeFlags.AwaitContext |
        ts.NodeFlags.ContextFlags |
        ts.NodeFlags.TypeExcludesFlags,
    ),
  )
}
