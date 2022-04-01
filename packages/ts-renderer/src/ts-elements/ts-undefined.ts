import ts from "typescript"

export interface TSUndefined {
  children?: undefined
}

export type TSUndefinedElement = React.ReactElement<TSUndefined, "ts-undefined">

export function generateUndefined(): ts.KeywordTypeNode<ts.SyntaxKind.UndefinedKeyword> {
  return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
}
