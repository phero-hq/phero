import { Project } from "ts-morph"
import path from "path"
import { RPCFunction, SamenManifest } from "../domain/manifest"
import { formatCode, generateParameters, generateType } from "./utils"

export default async function generateApiEndpoints(
  manifest: SamenManifest,
  samenFilePath: string,
  rpcFunctionsPath: string,
): Promise<void> {
  const userProject = new Project({
    // compilerOptions: { outDir: rpcFunctionsPath, declaration: true },
    tsConfigFilePath:
      "/Users/Jasper/Code/Press Play/samen/example/server/tsconfig.json",
  })
  console.log("building user project")

  await userProject.emit()
  console.log(
    "builded user project",
    userProject.getPreEmitDiagnostics().length,
  )
  const project = new Project({
    compilerOptions: { outDir: rpcFunctionsPath, declaration: true },
  })

  for (const rpcFunction of manifest.rpcFunctions) {
    const code = generateCode(manifest, samenFilePath, rpcFunction)
    // project.addSourceFileAtPath(samenFilePath)
    project.createSourceFile(rpcFunction.fileName, code)
  }

  await project.emit()
}

function generateCode(
  manifest: SamenManifest,
  samenFilePath: string,
  rpcFunction: RPCFunction,
): string {
  const params = generateParameters(rpcFunction.parameters)
  const args = rpcFunction.parameters.map((p) => p.name).join(", ")
  const returnType = `Promise<${generateType(rpcFunction.returnType)}>`

  return formatCode(`
   import { ${rpcFunction.name} } from '${rpcFunction.filePath.outputFile}';

    ${rpcFunction.modelIds
      .map((modelId) => manifest.models[modelId].ts)
      .join("\n")}

    export async function rpc_${rpcFunction.name}(${params}): ${returnType} {
      // TODO: Validate parameters

      const result = await ${rpcFunction.name}(${args})

      // TODO: Validate result

      return result
    }
  `)
}
