import ts from "typescript"

export interface TSAny {
  children?: undefined
}

export type TSAnyElement = React.ReactElement<TSAny, "ts-any">

export function generateAny() {
  return ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
}
