import { promises as fs } from "fs"
import { Project } from "ts-morph"
import { ClientSDKCompilerError, validateProject } from "../errors"
import * as paths from "../paths"
import clientSDK from "./templates/clientSDK"

export default async function generateClientSDK(
  projectDir: string,
): Promise<void> {
  try {
    const project = new Project({
      compilerOptions: {
        declaration: true,
        outDir: paths.clientSdkDir(projectDir),
      },
    })
    const manifest = JSON.parse(
      await fs.readFile(paths.clientManifestFile(projectDir), "utf-8"),
    )

    const code = clientSDK({ manifest })
    project.createSourceFile("index.ts", code)
    validateProject(project)
    await project.emit()
  } catch (error) {
    throw new ClientSDKCompilerError(error)
  }
}
