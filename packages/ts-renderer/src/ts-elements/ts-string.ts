import ts from "typescript"

export interface TSString {
  children?: undefined
}

export type TSStringElement = React.ReactElement<TSString, "ts-string">

export function generateString(): ts.KeywordTypeNode<ts.SyntaxKind.StringKeyword> {
  return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
}
