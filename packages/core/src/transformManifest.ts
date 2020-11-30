import { promises as fs } from "fs"
import { Project } from "ts-morph"
import { SamenManifest } from "./domain/manifest"

export default async function transformManifest(
  manifestPath: string,
  targetPath: string,
  transform: (manifest: SamenManifest) => string,
): Promise<void> {
  const project = new Project({
    compilerOptions: { declaration: true, outDir: targetPath },
  })
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"))
  project.createSourceFile("index.ts", transform(manifest))
  await project.emit()
}
