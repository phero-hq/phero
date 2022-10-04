import ts from "typescript"

interface TypeParamProps {
  name: string
  // TODO constraint
  default?: ts.TypeNode
}

export function typeParam(props: TypeParamProps): ts.TypeParameterDeclaration {
  return ts.factory.createTypeParameterDeclaration(
    undefined,
    props.name,
    undefined,
    props.default,
  )
}
