import { promises as fs } from "fs";
import { Project } from "ts-morph";

export default async function buildClient(
  manifestPath: string,
  targetPath: string
): Promise<void> {
  const project = new Project({
    compilerOptions: {
      declaration: true,
      sourceRoot: "index.ts",
      outDir: targetPath,
    },
  });

  // TODO: convert manifest to client SDK
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));

  project.createSourceFile("index.ts", "export const Sjaak = true;");
  await project.emit();
}
