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
    await ensureDir(paths.clientBuildDir(projectDir))

    const project = new Project({
      compilerOptions: {
        outDir: paths.clientBuildDir(projectDir),
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
