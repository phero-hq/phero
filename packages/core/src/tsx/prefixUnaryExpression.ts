import ts from "typescript"

type PrefixBinaryOperator = "++" | "--" | "+" | "-" | "~" | "!"

export function prefixUnaryExpression(
  op: PrefixBinaryOperator,
  expr: ts.Expression,
): ts.PrefixUnaryExpression {
  return ts.factory.createPrefixUnaryExpression(
    generatePrefixOperator(op),
    expr,
  )
}

function generatePrefixOperator(
  op: PrefixBinaryOperator,
): ts.PrefixUnaryOperator {
  switch (op) {
    case "++":
      return ts.SyntaxKind.PlusPlusToken
    case "--":
      return ts.SyntaxKind.MinusMinusToken
    case "+":
      return ts.SyntaxKind.PlusToken
    case "-":
      return ts.SyntaxKind.MinusToken
    case "~":
      return ts.SyntaxKind.TildeToken
    case "!":
      return ts.SyntaxKind.ExclamationToken
  }
}
