import path from "path"
import { Project, ts } from "ts-morph"

export default async function getUserCompilerOptions(
  projectDir: string,
): Promise<ts.CompilerOptions> {
  const options = new Project({
    tsConfigFilePath: path.join(projectDir, "tsconfig.json"),
  }).getCompilerOptions()

  const {
    lib,
    types,
    module,
    moduleResolution,
    strict,
    target,
    esModuleInterop,
    jsx,
    isolatedModules,
    allowSyntheticDefaultImports,
    allowJs,
  } = options

  return {
    lib,
    types,
    module,
    moduleResolution,
    strict,
    target,
    esModuleInterop,
    jsx,
    isolatedModules,
    allowSyntheticDefaultImports,
    allowJs,
  }
}
