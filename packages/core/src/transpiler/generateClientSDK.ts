import { Project } from "ts-morph"
import { ensureDir } from "../cli"
import { ClientEnvironment, SamenManifest } from "../domain"
import { ClientSDKCompilerError, validateProject } from "../errors"
import * as paths from "../paths"
import getUserCompilerOptions from "./getUserCompilerOptions"
import clientSDK from "./templates/clientSDK"

export default async function generateClientSDK(
  manifest: SamenManifest,
  projectDir: string,
  environment: ClientEnvironment,
): Promise<void> {
  try {
    const outDir = paths.clientBuildDir(projectDir)
    await ensureDir(outDir)
    const userCompilerOptions = await getUserCompilerOptions(projectDir)
    const project = new Project({
      compilerOptions: {
        ...userCompilerOptions,
        outDir,
        declaration: true,
      },
    })

    const code = clientSDK({ manifest, environment })
    project.createSourceFile("index.ts", code)
    validateProject(project)
    await project.emit()
  } catch (error) {
    throw new ClientSDKCompilerError(error)
  }
}
