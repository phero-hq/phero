import { promises as fs } from "fs"
import { Project } from "ts-morph"
import { Environment } from "../cli"
import { ClientConfig, SamenManifest } from "../domain"
import { ClientSDKCompilerError, validateProject } from "../errors"
import * as paths from "../paths"
import clientSDK from "./templates/clientSDK"

export default async function generateClientSDK(
  environment: Environment,
  projectDir: string,
): Promise<void> {
  try {
    const project = new Project({
      compilerOptions: {
        declaration: true,
        outDir: paths.clientSdkDir(projectDir),
      },
    })
    const manifest = (JSON.parse(
      await fs.readFile(paths.clientManifestFile(projectDir), "utf-8"),
    ) as unknown) as SamenManifest
    const config = (JSON.parse(
      await fs.readFile(paths.clientConfigFile(projectDir), "utf-8"),
    ) as unknown) as ClientConfig
    const apiUrl = {
      [Environment.development]: config.development.url,
      [Environment.production]: config.production.url,
    }[environment]
    const code = clientSDK({ manifest, apiUrl })
    project.createSourceFile("index.ts", code)
    validateProject(project)
    await project.emit()
  } catch (error) {
    throw new ClientSDKCompilerError(error)
  }
}
