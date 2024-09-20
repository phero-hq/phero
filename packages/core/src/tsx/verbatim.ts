import ts from "typescript"

export function verbatim(source: string): any {
  return ts.createSourceFile(
    "thisFileDoesNotExist.ts",
    source,
    ts.ScriptTarget.ESNext,
  )
}
