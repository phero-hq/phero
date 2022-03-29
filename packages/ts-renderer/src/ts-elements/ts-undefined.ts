import ts from "typescript"

export interface TSUndefined {
  children?: undefined
}

export type TSUndefinedElement = React.ReactElement<TSUndefined, "ts-undefined">

export function generateUndefined(): ts.KeywordTypeNode {
  return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
}
