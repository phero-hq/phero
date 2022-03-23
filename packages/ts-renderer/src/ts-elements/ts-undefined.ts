import ts from "typescript"

export interface TSUndefined {}

export type TSUndefinedElement = React.ReactElement<TSUndefined, "ts-undefined">

export function generateUndefined() {
  return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
}
