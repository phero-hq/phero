import ts from "typescript"

type PostfixBinaryOperator = "++" | "--"

export function postfixUnaryExpression(
  expr: ts.Expression,
  op: PostfixBinaryOperator,
): ts.PostfixUnaryExpression {
  return ts.factory.createPostfixUnaryExpression(
    expr,
    generatePostfixOperator(op),
  )
}

function generatePostfixOperator(
  op: PostfixBinaryOperator,
): ts.PostfixUnaryOperator {
  switch (op) {
    case "++":
      return ts.SyntaxKind.PlusPlusToken
    case "--":
      return ts.SyntaxKind.MinusMinusToken
  }
}
