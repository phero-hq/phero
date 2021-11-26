import { promises as fs } from "fs"
import path from "path"
import ts from "typescript"

import { ClientSource } from "./generateClient"

export default async function writeClientSource(
  outputPath: string,
  client: ClientSource,
): Promise<void> {
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    noEmitHelpers: true,
    removeComments: true,
    omitTrailingSemicolon: false,
  })

  await fs.mkdir(outputPath, { recursive: true })

  await fs.writeFile(
    path.join(outputPath, "domain.ts"),
    printer.printFile(client.domainSource),
    { encoding: "utf-8" },
  )

  await fs.copyFile(
    path.join(__dirname, "../src/BaseSamenClient.ts"),
    path.join(outputPath, "BaseSamenClient.ts"),
  )

  await fs.writeFile(
    path.join(outputPath, `SamenClient.ts`),
    printer.printFile(client.samenClientSource),
    { encoding: "utf-8" },
  )
}
