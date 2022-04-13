import { promises as fs } from "fs"
import path from "path"
import ts from "typescript"

import { ClientSource } from "../ClientSource"

const printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  noEmitHelpers: true,
  removeComments: true,
  omitTrailingSemicolon: false,
})

export default async function writeClientSource(
  outputPath: string,
  client: ClientSource,
): Promise<void> {
  await fs.mkdir(outputPath, { recursive: true })

  await fs.writeFile(
    path.join(outputPath, "domain.ts"),
    printSourceFile(client.domainSource),
    { encoding: "utf-8" },
  )

  await fs.copyFile(
    path.join(__dirname, "../../src/BaseSamenClient.ts"),
    path.join(outputPath, "BaseSamenClient.ts"),
  )

  await fs.writeFile(
    path.join(outputPath, `SamenClient.ts`),
    printSourceFile(client.samenClientSource),
    { encoding: "utf-8" },
  )

  const program = ts.createProgram(
    [
      path.join(outputPath, "domain.ts"),
      path.join(outputPath, "BaseSamenClient.ts"),
      path.join(outputPath, "SamenClient.ts"),
    ],
    { declaration: true },
  )
  const emitResult = program.emit()

  if (emitResult.emitSkipped) {
    throw new Error("compilation failed")
  }
}

export function printSourceFile(source: ts.SourceFile): string {
  return printer.printFile(source)
}
