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
  outputPathBase: string,
  outputPathClient: string,
  client: ClientSource,
): Promise<void> {
  await fs.mkdir(outputPathClient, { recursive: true })
  await fs.mkdir(outputPathBase, { recursive: true })

  await fs.writeFile(
    path.join(outputPathClient, "domain.ts"),
    printSourceFile(client.domainSource),
    { encoding: "utf-8" },
  )

  await fs.writeFile(
    path.join(outputPathClient, "SamenClient.ts"),
    printSourceFile(client.samenClientSource),
    { encoding: "utf-8" },
  )

  await fs.writeFile(
    path.join(outputPathClient, "index.ts"),
    printSourceFile(client.samenIndexSource),
    { encoding: "utf-8" },
  )

  await fs.copyFile(
    path.join(__dirname, "../../src/templates/BaseSamenClient.ts"),
    path.join(outputPathClient, "BaseSamenClient.ts"),
  )

  await fs.copyFile(
    path.join(__dirname, "../../src/templates/ParseResult.ts"),
    path.join(outputPathClient, "ParseResult.ts"),
  )

  const clientProgram = ts.createProgram(
    [
      path.join(outputPathClient, "index.ts"),
      path.join(outputPathClient, "domain.ts"),
      path.join(outputPathClient, "SamenClient.ts"),
      path.join(outputPathClient, "BaseSamenClient.ts"),
      path.join(outputPathClient, "ParseResult.ts"),
    ],
    {
      declaration: true,
    },
  )

  const clientEmitResult = clientProgram.emit()

  if (clientEmitResult.emitSkipped) {
    throw new Error("compilation failed")
  }

  // write index file that exports SamenClient and domains
  await fs.writeFile(
    path.join(outputPathBase, `index.ts`),
    printSourceFile(client.programIndexSource),
    { encoding: "utf-8" },
  )

  const program = ts.createProgram([path.join(outputPathBase, "index.ts")], {
    declaration: true,
  })

  const emitResult = program.emit()

  if (emitResult.emitSkipped) {
    throw new Error("compilation failed")
  }
}

export function printSourceFile(source: ts.SourceFile): string {
  return printer.printFile(source)
}
