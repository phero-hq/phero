import { promises as fs } from "fs"
import { Project } from "ts-morph"
import { JSType } from "../domain/JSValue"
import { RPCFunction, SamenManifest } from "../domain/manifest"
import { ClientSDKCompilerError, validateProject } from "../errors"
import * as paths from "../paths"
import { formatCode, generateParameters, generateType } from "./utils"

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
    project.createSourceFile("index.ts", transformToClientSDK(manifest))
    validateProject(project)
    await project.emit()
  } catch (error) {
    throw new ClientSDKCompilerError(error)
  }
}

export function transformToClientSDK(manifest: SamenManifest): string {
  return formatCode(`
    ${requestFunction}

    ${Object.keys(manifest.models).map(
      (modelId) => `export ${manifest.models[modelId].ts}`,
    )}

    ${manifest.rpcFunctions.map(genRPC).join("\n")}
  `)
}

const requestFunction = `
  // TODO: Get from manifest
  const ENDPOINT = "http://localhost:4000/"

  async function request<T>(
    name: string,
    body: object,
    isVoid: boolean,
  ): Promise<T> {
    try {
      const result = await fetch(ENDPOINT + name, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!result.ok) {
        throw new Error(\`Call failed with status \${result.status}\`)
      }
      if (!isVoid) {
        const data = await result.json()
        return data as T
      }
    } catch (err) {
      console.error(err)
      throw new Error("Network error")
    }
  }
`

const genRPC = (rpc: RPCFunction): string => {
  const { name } = rpc
  const params = generateParameters(rpc.parameters)
  const returnType = `Promise<${generateType(rpc.returnType)}>`
  const body = `{${rpc.parameters.map((p) => p.name).join(",")}}`
  const isVoid = rpc.returnType.type === JSType.untyped ? "true" : "false"

  return `
    export async function ${name}(${params}): ${returnType} {
      return request("${name}", ${body}, ${isVoid});
    }
  `
}
