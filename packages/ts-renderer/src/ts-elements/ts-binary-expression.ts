import React from "react"
import ts from "typescript"
import { generateExpression, TSExpressionElement } from "./ts-expression"

export interface TSBinaryExpression {
  left: TSExpressionElement
  op: "==" | "===" | "<=" | ">=" | "!=" | "!=="
  right: TSExpressionElement
}

export type TSBinaryExpressionElement = React.ReactElement<
  TSBinaryExpression,
  "ts-binary-expression"
>

export function generateBinaryExpression(
  element: TSBinaryExpressionElement,
): ts.BinaryExpression {
  return ts.factory.createBinaryExpression(
    generateExpression(element.props.left),
    generateOperator(element.props.op),
    generateExpression(element.props.right),
  )
}

function generateOperator(
  op: TSBinaryExpression["op"],
): ts.BinaryOperator | ts.BinaryOperatorToken {
  switch (op) {
    case "==":
      return ts.factory.createToken(ts.SyntaxKind.EqualsEqualsToken)
    case "===":
      return ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken)
    case "<=":
      return ts.factory.createToken(ts.SyntaxKind.LessThanEqualsToken)
    case ">=":
      return ts.factory.createToken(ts.SyntaxKind.GreaterThanEqualsToken)
    case "!=":
      return ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsToken)
    case "!==":
      return ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken)
  }
}
