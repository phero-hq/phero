import ts from "typescript"

export interface TSNumber {}

export type TSNumberElement = React.ReactElement<TSNumber, "ts-number">

export function generateNumber() {
  return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
}
