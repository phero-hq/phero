import ts from "typescript"
import { generateModifiers } from "./lib"

interface ArrowFunctionProps {
  export?: boolean
  async?: boolean
  params: ts.ParameterDeclaration[]
  returnType: ts.TypeNode
  body: ts.Block | ts.Statement[]
}

export function arrowFunction(props: ArrowFunctionProps): ts.ArrowFunction {
  return ts.factory.createArrowFunction(
    generateModifiers([
      props.async && ts.SyntaxKind.AsyncKeyword,
      props.export && ts.SyntaxKind.ExportKeyword,
    ]),
    undefined,
    props.params,
    props.returnType,
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    Array.isArray(props.body) ? ts.factory.createBlock(props.body) : props.body,
  )
}
