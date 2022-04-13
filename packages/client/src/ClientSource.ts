import ts from "typescript"

export interface ClientSource {
  domainSource: ts.SourceFile
  samenClientSource: ts.SourceFile
}
