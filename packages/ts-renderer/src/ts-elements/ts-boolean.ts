import ts from "typescript"

export interface TSBoolean {
  children?: undefined
}

export type TSBooleanElement = React.ReactElement<TSBoolean, "ts-boolean">

export function generateBoolean(): ts.KeywordTypeNode<ts.SyntaxKind.BooleanKeyword> {
  return ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
}
