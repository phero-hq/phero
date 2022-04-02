import ts from "typescript"

interface TypeReferenceProps {
  name: string
  args?: ts.TypeNode[]
}

export function typeReference(props: TypeReferenceProps): ts.TypeReferenceNode {
  return ts.factory.createTypeReferenceNode(
    ts.factory.createIdentifier(props.name),
    props.args,
  )
}
