import ts from "typescript"
import { ParsedPheroApp } from "../parsePheroApp"
import { VirtualCompilerHost } from "../VirtualCompilerHost"
import generateRootIndexFile from "./generateRootIndexFile"
import generateLibFile from "./generateLibFile"
import { generateServiceHandlerFile } from "./generateServiceHandlerFile"
import generateServiceIndexFile from "./generateServiceIndexFile"

export interface ExportFile {
  name: string
  js: string
}

export default function generateExport(app: ParsedPheroApp): ExportFile[] {
  return createExportFile([
    { name: "index", nodes: generateRootIndexFile(app), isRoot: true },
    { name: "lib", nodes: [generateLibFile()] },
    ...app.services.flatMap((service) => [
      {
        name: `${service.name}/handler`,
        nodes: generateServiceHandlerFile(service),
      },
      {
        name: `${service.name}/index`,
        nodes: generateServiceIndexFile(),
        isRoot: true,
      },
    ]),
  ])
}

function createExportFile(
  files: { name: string; nodes: ts.Node[]; isRoot?: boolean }[],
): ExportFile[] {
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: true,
  })

  const vHost = new VirtualCompilerHost({
    declaration: false,
  })

  for (const file of files) {
    const tsFileName = `${file.name}.ts`

    const tsSourceFile = ts.createSourceFile(
      tsFileName,
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

    vHost.addFile(tsFileName, tsContent)
  }

  const prog = vHost.createProgram(
    files.filter((f) => f.isRoot).map((f) => f.name),
  )

  if (prog.emit().diagnostics.length) {
    throw new Error("Export build doesn't compile")
  }

  return files.map((file) => {
    const jsFileName = `${file.name}.js`
    return {
      name: jsFileName,
      js: vHost.getFile(jsFileName)!,
    }
  })
}
