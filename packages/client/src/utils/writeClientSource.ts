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
  const pathClientExists = await exists(outputPathClient)
  if (!pathClientExists) {
    await fs.mkdir(outputPathClient, { recursive: true })
  }

  const pathBaseExists = await exists(outputPathBase)
  if (!pathBaseExists) {
    await fs.mkdir(outputPathBase, { recursive: true })
  }

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

  const indexPath = path.join(outputPathClient, "index.ts")
  const indexPathExists = await exists(indexPath)
  if (!indexPathExists) {
    await fs.writeFile(
      path.join(outputPathClient, "index.ts"),
      printSourceFile(client.samenIndexSource),
      { encoding: "utf-8" },
    )
  }

  const baseSamenClientPath = path.join(outputPathClient, "BaseSamenClient.ts")
  const baseSamenClientPathExists = await exists(baseSamenClientPath)
  if (!baseSamenClientPathExists) {
    await fs.copyFile(
      path.join(__dirname, "../../src/templates/BaseSamenClient.ts"),
      baseSamenClientPath,
    )
  }

  const baseParseResultPath = path.join(outputPathClient, "ParseResult.ts")
  const baseParseResultPathExists = await exists(baseParseResultPath)
  if (!baseParseResultPathExists) {
    await fs.copyFile(
      path.join(__dirname, "../../src/templates/ParseResult.ts"),
      baseParseResultPath,
    )
  }

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
}

export function printSourceFile(source: ts.SourceFile): string {
  return printer.printFile(source)
}

async function exists(pathString: string) {
  // try {
  //   await fs.access(pathString)
  //   return true
  // } catch {
  return false
  // }
}
