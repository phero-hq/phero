import { promises as fs } from "fs";
import { Project } from "ts-morph";
import { SamenFile } from "./tmp";

export default async function generate(
  manifestPath: string,
  targetPath: string,
  transform: (manifest: SamenFile) => string
): Promise<void> {
  const project = new Project({
    compilerOptions: { declaration: true, outDir: targetPath },
  });
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
  project.createSourceFile("index.ts", transform(manifest));
  await project.emit();
}
