import { Project } from "ts-morph"
import path from "path"
import { RPCFunction, SamenManifest } from "../domain/manifest"
import { formatCode, generateParameters, generateType } from "./utils"
import * as paths from "../paths"
import { ApiEndpointCompilerError, validateProject } from "../errors"

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
        declaration: true,
      },
    })

    for (const rpcFunction of manifest.rpcFunctions) {
      const code = generateCode(manifest, relativeSamenFilePath, rpcFunction)
      project.createSourceFile(`${rpcFunction.name}.ts`, code)
    }

    validateProject(project)

    await project.emit()
  } catch (error) {
    throw new ApiEndpointCompilerError(error)
  }
}

function generateCode(
  manifest: SamenManifest,
  samenFilePath: string,
  rpcFunction: RPCFunction,
): string {
  const params = generateParameters(rpcFunction.parameters)
  const args = rpcFunction.parameters.map((p) => p.name)
  const returnType = `Promise<${generateType(rpcFunction.returnType)}>`

  return formatCode(`
   import { ${rpcFunction.name} } from '${samenFilePath}';

  ${rpcFunction.modelIds
    .map((modelId) => manifest.models[modelId].ts)
    .join("\n")}

    export async function handler(event: any) {
      const body = JSON.parse(event.body)
      const result = await ${rpcFunction.name}(${args
    .map((a) => `body.${a}`)
    .join(", ")})
      return {
        isBase64Encoded: false,
        statusCode: 200,
        body: result && JSON.stringify(result, null, 4),
        headers: {
          "Content-Type": "application/json",
        },
      }
    }


    export async function rpc_${rpcFunction.name}(${params}): ${returnType} {
      // TODO: Validate parameters

      const result = await ${rpcFunction.name}(${args.join(", ")})

      // TODO: Validate result

      return result
    }
  `)
}
