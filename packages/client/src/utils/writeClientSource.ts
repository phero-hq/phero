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
  const samenClientPath = path.join(outputPathClient, "SamenClient.ts")
  const domainPath = path.join(outputPathClient, "domain.ts")
  const indexPath = path.join(outputPathClient, "index.ts")
  const baseSamenClientPath = path.join(outputPathClient, "BaseSamenClient.ts")
  const parseResultPath = path.join(outputPathClient, "ParseResult.ts")

  await Promise.all([
    fs.mkdir(outputPathClient, { recursive: true }),
    fs.mkdir(outputPathBase, { recursive: true }),
    fs.writeFile(domainPath, printSourceFile(client.domainSource), {
      encoding: "utf-8",
    }),
    fs.writeFile(samenClientPath, printSourceFile(client.samenClientSource), {
      encoding: "utf-8",
    }),
    fs.writeFile(indexPath, printSourceFile(client.samenIndexSource), {
      encoding: "utf-8",
    }),
    fs.copyFile(
      path.join(__dirname, "../../package/BaseSamenClient.ts"),
      baseSamenClientPath,
    ),
    fs.copyFile(
      path.join(__dirname, "../../package/ParseResult.ts"),
      parseResultPath,
    ),
  ])

  const clientProgram = ts.createProgram(
    [
      indexPath,
      domainPath,
      samenClientPath,
      baseSamenClientPath,
      parseResultPath,
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
