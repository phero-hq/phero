import { promises as fs } from "fs"
import path from "path"
import ts from "typescript"

const printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  noEmitHelpers: true,
  removeComments: true,
  omitTrailingSemicolon: false,
})

export default async function writeClientSource(
  clientSamenSourceFile: ts.SourceFile,
): Promise<void> {
  // TODO check where the source lives
  const hasSourceDir = await fileExists(path.join("src"))
  await fs.writeFile(
    hasSourceDir ? path.join("./src/samen.ts") : path.join("./samen.ts"),
    printSourceFile(clientSamenSourceFile),
    {
      encoding: "utf-8",
    },
  )
}

export function printSourceFile(source: ts.SourceFile): string {
  return printer.printFile(source)
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
