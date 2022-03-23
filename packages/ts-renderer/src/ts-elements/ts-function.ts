import React from "react"
import ts from "typescript"
import { generateParameter, TSParameterElement } from "./ts-parameter"
import { generateStatement, TSStatementElement } from "./ts-statement"
import { generateTypeNode, TSTypeElement } from "./ts-type"
import { generateModifiers } from "./utils"

export interface TSFunction {
  export?: boolean
  async?: boolean
  name: string
  params: TSParameterElement[]
  returnType: TSTypeElement
  children?: TSStatementElement | TSStatementElement[]
}

export type TSFunctionElement = React.ReactElement<TSFunction, "ts-function">

export function generateFunction(
  element: TSFunctionElement,
): ts.FunctionDeclaration {
  const body = element.props.children
    ? ts.factory.createBlock(
        React.Children.map<ts.Statement, TSStatementElement>(
          element.props.children,
          generateStatement,
        ),
      )
    : undefined

  return ts.factory.createFunctionDeclaration(
    undefined,
    generateModifiers([
      element.props.async && ts.SyntaxKind.AsyncKeyword,
      element.props.export && ts.SyntaxKind.ExportKeyword,
    ]),
    undefined,
    element.props.name,
    undefined,
    element.props.params.map(generateParameter),
    generateTypeNode(element.props.returnType),
    body,
  )
}
