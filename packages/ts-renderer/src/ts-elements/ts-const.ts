import React from "react"
import ts from "typescript"
import { generateExpression, TSExpressionElement } from "./ts-expression"

export interface TSConst {
  name: string
  init?: TSExpressionElement
  children?: undefined
}

export type TSConstElement = React.ReactElement<TSConst, "ts-const">

export function generateConst(element: TSConstElement): ts.VariableStatement {
  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          element.props.name,
          undefined,
          undefined,
          element.props.init
            ? generateExpression(element.props.init)
            : undefined,
        ),
      ],
      ts.NodeFlags.Const |
        ts.NodeFlags.AwaitContext |
        ts.NodeFlags.ContextFlags |
        ts.NodeFlags.TypeExcludesFlags,
    ),
  )
}
