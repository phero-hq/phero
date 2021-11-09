import path from "path"
import { Project, ts } from "ts-morph"

export async function getUserCompilerOptions(
  projectDir: string,
): Promise<ts.CompilerOptions> {
  const options = new Project({
    tsConfigFilePath: path.join(projectDir, "tsconfig.json"),
  }).getCompilerOptions()

  delete options.rootDir
  options.noEmit = false
  return options
}
