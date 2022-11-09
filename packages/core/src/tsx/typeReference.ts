import ts from "typescript"

interface TypeReferenceProps {
  name: string | ts.EntityName
  args?: ts.TypeNode[]
}

export function typeReference(props: TypeReferenceProps): ts.TypeReferenceNode {
  return ts.factory.createTypeReferenceNode(
    typeof props.name === "string"
      ? ts.factory.createIdentifier(props.name)
      : props.name,
    props.args,
  )
}
