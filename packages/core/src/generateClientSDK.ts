import { RPCFunction, SamenManifest } from "./domain/manifest"
import { JSType, JSValue } from "./domain/JSValue"
import { formatCode } from "./utils"
import transformManifest from "./transformManifest"

export default function generateClientSDK(
  manifestPath: string,
  sdkPath: string,
): Promise<void> {
  return transformManifest(manifestPath, sdkPath, transformToClientSDK)
}

export function transformToClientSDK(manifest: SamenManifest): string {
  return formatCode(`
    import request from './request';

    ${Object.keys(manifest.models).map(
      (modelId) => `export ${manifest.models[modelId].ts}`,
    )}

    ${manifest.rpcFunctions.map(genRPC)}
  `)
}
const genRPC = (rpc: RPCFunction): string => {
  const { name } = rpc
  const params = rpc.parameters.map((p) => `${p.name}: ${genType(p.value)}`)
  const body = `{${rpc.parameters.map((p) => p.name).join(",")}}`
  const returnType = genType(rpc.returnType)
  const isVoid = rpc.returnType.type === JSType.untyped ? "true" : "false"

  return `
    export async function ${name}(${params}): Promise<${returnType}> {
      return request("${name}", ${body}, ${isVoid});
    }
  `
}

const genType = (value: JSValue): string => {
  switch (value.type) {
    case JSType.number:
    case JSType.string:
    case JSType.boolean:
    case JSType.null:
    case JSType.undefined:
      return value.type

    case JSType.ref:
      return value.id

    case JSType.array:
      return `${value.elementType.type}[]`

    case JSType.tuple:
      return `[${value.elementTypes.map(genType).join(", ")}]`

    case JSType.date:
      return "Date"

    case JSType.oneOfTypes:
      return `${value.oneOfTypes.map(genType).join(" | ")}`

    case JSType.object:
      return `{${value.properties
        .map((p) => `${p.name}: ${genType(p)}`)
        .join(";")}}`

    case JSType.untyped:
      return "void"
  }
}
