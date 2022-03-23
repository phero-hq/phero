import React from "react"
import ts from "typescript"
import { generateStatement, TSStatementElement } from "./ts-statement"

export interface TSBlock {
  children: TSStatementElement | TSStatementElement[]
}

export type TSBlockElement = React.ReactElement<TSBlock, "ts-block">

export function generateBlock(element: TSBlockElement): ts.Block {
  const statements = React.Children.map<ts.Statement, TSStatementElement>(
    element.props.children,
    generateStatement,
  )
  return ts.factory.createBlock(statements)
}
