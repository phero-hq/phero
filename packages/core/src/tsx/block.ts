import ts from "typescript"

export function block(...statements: ts.Statement[]): ts.Block {
  return ts.factory.createBlock(statements)
}
