import ts from "typescript"

export interface TSNumber {
  children?: undefined
}

export type TSNumberElement = React.ReactElement<TSNumber, "ts-number">

export function generateNumber() {
  return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
}
