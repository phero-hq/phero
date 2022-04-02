import ts from "typescript"

export function bundle(sourceFiles: ts.SourceFile[]): ts.Bundle {
  return ts.factory.createBundle(sourceFiles)
}
