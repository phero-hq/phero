import { RPCFunction, SamenManifest } from "../domain/manifest"
import { JSType, JSValue } from "../domain/JSValue"
import { formatCode, generateParameters, generateType } from "./utils"
import transformManifest from "./transformManifest"

export default function generateClientSDK(
  manifestPath: string,
  sdkPath: string,
): Promise<void> {
  return transformManifest(manifestPath, sdkPath, transformToClientSDK)
}

export function transformToClientSDK(manifest: SamenManifest): string {
  return formatCode(`
    ${requestFunction}

    ${Object.keys(manifest.models).map(
      (modelId) => `export ${manifest.models[modelId].ts}`,
    )}

    ${manifest.rpcFunctions.map(genRPC)}
  `)
}

const requestFunction = `
  // TODO: Get from manifest
  const ENDPOINT = "http://localhost:4000/"

  async function request<T>(
    name: string,
    body: object,
    isVoid: boolean,
  ): Promise<T | void> {
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
