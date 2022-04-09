import ts from "typescript"

export function verbatim(source: string): any {
  return ts.createUnparsedSourceFile(source)
}
