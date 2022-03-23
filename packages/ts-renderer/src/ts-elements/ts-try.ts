import React from "react"
import ts from "typescript"
import { generateBlock, TSBlock, TSBlockElement } from "./ts-block"
import { generateExpression, TSExpressionElement } from "./ts-expression"

export interface TSTry {
  children:
    | [TSBlockElement, TSCatchElement]
    | [TSBlockElement, TSCatchElement, TSFinallyElement]
}

export type TSTryElement = React.ReactElement<TSTry, "ts-try">

export interface TSCatch {
  errorName: string
  children: TSBlockElement
}

export type TSCatchElement = React.ReactElement<TSCatch, "ts-catch">

export interface TSFinally {
  children: TSBlockElement
}

export type TSFinallyElement = React.ReactElement<TSFinally, "ts-finally">

export function generateTry(element: TSTryElement): ts.TryStatement {
  const [_block, _catch, _finally] = element.props.children
  return ts.factory.createTryStatement(
    generateBlock(_block),
    ts.factory.createCatchClause(
      ts.factory.createVariableDeclaration(
        ts.factory.createIdentifier(_catch.props.errorName),
        undefined,
        undefined,
        undefined,
      ),
      generateBlock(_catch.props.children),
    ),
    _finally && generateBlock(_finally.props.children),
  )
}
