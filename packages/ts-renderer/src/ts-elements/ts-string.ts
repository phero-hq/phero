import ts from "typescript"

export interface TSString {}

export type TSStringElement = React.ReactElement<TSString, "ts-string">

export function generateString() {
  return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
}
