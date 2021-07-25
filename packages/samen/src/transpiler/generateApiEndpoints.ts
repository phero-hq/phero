import {
  ApiEndpointCompilerError,
  getUserCompilerOptions,
  paths,
  SamenConfig,
  SamenManifest,
  validateProject,
} from "@samen/core"
import path from "path"
import { Project } from "ts-morph"
import apiEndpoint from "./templates/apiEndpoint"

export default async function generateApiEndpoints(
  manifest: SamenManifest,
  samenFilePath: string,
  config: SamenConfig,
  isDebugFlag: boolean = false,
): Promise<void> {
  try {
    const userProjectPath = process.cwd()

    const relativeSamenFilePath = `./${path
      .relative(userProjectPath, samenFilePath)
      .replace(/(.+)\..+$/, "$1")}`

    const userCompilerOptions = await getUserCompilerOptions(userProjectPath)
    const project = new Project({
      compilerOptions: {
        ...userCompilerOptions,
        outDir: paths.userRpcFunctionsDir,
        declaration: true,
      },
    })

    for (const rpcFunction of manifest.rpcFunctions) {
      const code = apiEndpoint({
        manifest,
        relativeSamenFilePath,
        rpcFunction,
        config,
      })

      project.createSourceFile(
        `${
          rpcFunction.namespace.length
            ? `${rpcFunction.namespace.join(".")}.`
            : ""
        }${rpcFunction.name}.ts`,
        code,
      )

      if (isDebugFlag) {
        console.log(`----- ${rpcFunction.name} -----`)
        console.log(code)
        console.log(`-------------------------------`)
      }
    }

    validateProject(project)

    await project.emit()
  } catch (error) {
    throw new ApiEndpointCompilerError(error)
  }
}
