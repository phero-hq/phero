import { VirtualCompilerHost } from "@phero/core"
import ts from "typescript"
import { ExportFile, RawExportFile } from "../domain/PheroApp"

export default function compileExportToJS(
  files: RawExportFile[],
): ExportFile[] {
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: true,
  })

  const vHost = new VirtualCompilerHost({
    declaration: false,
  })

  for (const file of files) {
    const tsSourceFile = ts.createSourceFile(
      file.name,
      "",
      ts.ScriptTarget.ES5,
      false,
      ts.ScriptKind.TS,
    )

    const tsContent = printer.printList(
      ts.ListFormat.SourceFileStatements,
      ts.factory.createNodeArray(file.nodes),
      tsSourceFile,
    )

    vHost.addFile(file.name, tsContent)
  }

  const prog = vHost.createProgram(
    files.filter((f) => f.isRoot).map((f) => f.name),
  )

  if (prog.emit().diagnostics.length) {
    throw new Error("Export build doesn't compile")
  }

  return files.map((file) => {
    const jsFileName = file.name.replace(".ts", ".js")
    return {
      name: jsFileName,
      content: vHost.getFile(jsFileName)!,
    }
  })
}
