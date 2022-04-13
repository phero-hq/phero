import ts from "typescript"

export function sourceFile(...statements: ts.Statement[]): ts.SourceFile {
  return ts.factory.createSourceFile(
    statements,
    ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
    ts.NodeFlags.None,
  )
}
