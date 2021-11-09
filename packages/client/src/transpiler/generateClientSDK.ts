import {
  ClientEnvironment,
  ClientSDKCompilerError,
  ensureDir,
  getUserCompilerOptions,
  SamenManifest,
  validateProject,
} from "@samen/core"
import path from "path"
import { Project } from "ts-morph"
import clientSDK from "./templates/clientSDK"

export default async function generateClientSDK(
  manifest: SamenManifest,
  projectDir: string,
  environment: ClientEnvironment,
): Promise<void> {
  try {
    const outDir = path.join(projectDir, "node_modules/@samen/client/build")
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
