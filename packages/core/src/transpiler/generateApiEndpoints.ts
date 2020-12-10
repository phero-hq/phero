import path from "path"
import { Project, ts } from "ts-morph"
import { SamenManifest } from "../domain/manifest"
import { ApiEndpointCompilerError, validateProject } from "../errors"
import * as paths from "../paths"
import apiEndpoint from "./templates/apiEndpoint"

export default async function generateApiEndpoints(
  manifest: SamenManifest,
  samenFilePath: string,
): Promise<void> {
  try {
    const userProjectPath = process.cwd()

    const relativeSamenFilePath = `./${path
      .relative(userProjectPath, samenFilePath)
      .replace(/(.+)\..+$/, "$1")}`

    const project = new Project({
      compilerOptions: {
        outDir: paths.userRpcFunctionsDir,
        target: ts.ScriptTarget.ES2019,
        declaration: true,
        lib: ["ES2020"],
      },
    })

    for (const rpcFunction of manifest.rpcFunctions) {
      const code = apiEndpoint({ manifest, relativeSamenFilePath, rpcFunction })
      project.createSourceFile(`${rpcFunction.name}.ts`, code)
    }

    validateProject(project)

    await project.emit()
  } catch (error) {
    throw new ApiEndpointCompilerError(error)
  }
}
