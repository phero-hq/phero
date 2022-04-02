import ts from "typescript"

type BinaryOperator = "==" | "===" | "<=" | ">=" | "!=" | "!=="

export function binaryExpression(
  left: ts.Expression,
  op: BinaryOperator,
  right: ts.Expression,
): ts.BinaryExpression {
  return ts.factory.createBinaryExpression(left, generateOperator(op), right)
}

function generateOperator(
  op: BinaryOperator,
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
