import ts from "typescript"

export interface TSBoolean {
  children?: undefined
}

export type TSBooleanElement = React.ReactElement<TSBoolean, "ts-boolean">

export function generateBoolean() {
  return ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
}
