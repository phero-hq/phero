import ts from "typescript"

interface ConstructorProps {
  params?: ts.ParameterDeclaration[]
  block?: ts.Block | undefined
}

export function constructor(
  props: ConstructorProps,
): ts.ConstructorDeclaration {
  return ts.factory.createConstructorDeclaration(
    undefined,
    undefined,
    props.params ?? [],
    props.block,
  )
}
