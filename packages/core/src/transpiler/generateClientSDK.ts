import path from "path"
import { Project, ts } from "ts-morph"
import { ensureDir, Environment } from "../cli"
import { ClientEnvironment } from "../domain"
import {
  ClientSDKCompilerError,
  ConfigMissingError,
  validateProject,
} from "../errors"
import { readClientConfigFile, readClientManifestFile } from "../files"
import * as paths from "../paths"
import clientSDK from "./templates/clientSDK"

export default async function generateClientSDK(
  environment: Environment,
  projectDir: string,
): Promise<void> {
  try {
    const outDir = paths.clientBuildDir(projectDir)
    await ensureDir(outDir)

    const userCompilerOptions = await getUserCompilerOptions(projectDir)
    const project = new Project({
      compilerOptions: {
        types: [],
        ...userCompilerOptions,
        outDir,
        declaration: true,
      },
    })
    const manifest = await readClientManifestFile(projectDir)
    const config = await readClientConfigFile(projectDir)
    if (!config) throw new ConfigMissingError(projectDir)

    const apiUrl = {
      [Environment.development]: config.development.url,
      [Environment.production]: config.production.url,
    }[environment]

    const isEnvNode = config.env === ClientEnvironment.Node
    const code = clientSDK({ manifest, apiUrl, isEnvNode })
    project.createSourceFile("index.ts", code)
    validateProject(project)
    await project.emit()
  } catch (error) {
    throw new ClientSDKCompilerError(error)
  }
}

async function getUserCompilerOptions(
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
