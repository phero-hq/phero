import ts from "typescript"

export interface ClientSource {
  domainSource: ts.SourceFile
  samenIndexSource: ts.SourceFile
  samenClientSource: ts.SourceFile
}
