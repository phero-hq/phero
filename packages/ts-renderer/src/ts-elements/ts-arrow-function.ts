import React from "react"
import ts from "typescript"
import { generateBlock, TSBlockElement } from "./ts-block"
import { generateParameter, TSParameterElement } from "./ts-parameter"
import { generateTypeNode, TSTypeElement } from "./ts-type"
import { generateModifiers } from "./utils"

export interface TSArrowFunction {
  export?: boolean
  exportDefault?: boolean
  async?: boolean
  name?: string
  params: TSParameterElement[]
  returnType: TSTypeElement
  // body: TSExpression | TSStatement
  body: TSBlockElement
  children?: undefined
}

export type TSArrowFunctionElement = React.ReactElement<
  TSArrowFunction,
  "ts-arrow-function"
>

export function generateArrowFunction(
  element: TSArrowFunctionElement,
): ts.ArrowFunction {
  return ts.factory.createArrowFunction(
    generateModifiers([
      element.props.async && ts.SyntaxKind.AsyncKeyword,
      element.props.export && ts.SyntaxKind.ExportKeyword,
    ]),
    undefined,
    element.props.params.map(generateParameter),
    generateTypeNode(element.props.returnType),
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    generateBlock(element.props.body),
  )
}
