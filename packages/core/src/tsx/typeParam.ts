import ts from "typescript"

interface TypeParamProps {
  name: string | ts.Identifier
  constraint?: ts.TypeNode
  default?: ts.TypeNode
}

export function typeParam(props: TypeParamProps): ts.TypeParameterDeclaration {
  return ts.factory.createTypeParameterDeclaration(
    undefined,
    props.name,
    props.constraint,
    props.default,
  )
}
