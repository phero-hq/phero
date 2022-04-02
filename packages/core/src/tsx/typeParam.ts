import ts from "typescript"

interface TypeParamProps {
  name: string
  // TODO constraint
  default?: ts.TypeNode
}

export function typeParam(props: TypeParamProps): ts.TypeParameterDeclaration {
  return ts.factory.createTypeParameterDeclaration(
    props.name,
    undefined,
    props.default,
  )
}
