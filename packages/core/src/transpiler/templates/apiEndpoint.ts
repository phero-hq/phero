import { JSType, RPCFunction, SamenManifest } from "../../domain"
import functionSignature from "./shared/functionSignature"
import { parametersFromObject, untypedParameters } from "./shared/parameters"
import { promise } from "./shared/types"

interface Props {
  rpcFunction: RPCFunction
  manifest: SamenManifest
  relativeSamenFilePath: string
}

const apiEndpoint = (p: Props) => {
  const models = p.rpcFunction.modelIds
    .map((id) => p.manifest.models[id].ts)
    .join("\n")

  return `
    import { ${p.rpcFunction.name} } from '${p.relativeSamenFilePath}';

    ${models}

    ${handler(p)}

    ${rpcFunction(p)}
  `
}

const handler = (p: Props): string => {
  const { name, parameters, returnType } = p.rpcFunction
  const parametersFromBody = parametersFromObject({
    parameters,
    objectName: "body",
  })

  return `
    export async function handler(event: any) {
      const body = JSON.parse(event.body)
      const result = await ${name}(${parametersFromBody})
      return {
        isBase64Encoded: false,
        statusCode: 200,
        ${
          returnType.type === JSType.untyped
            ? "body: null,"
            : "body: result && JSON.stringify(result, null, 4),"
        }
        headers: {
          "Content-Type": "application/json",
        },
      }
    }
  `
}

const rpcFunction = (p: Props): string => {
  const { name, parameters, returnType } = p.rpcFunction
  const signature = functionSignature({
    name: `rpc_${name}`,
    parameters,
    returnType: promise(returnType),
  })

  return `
    export async function ${signature} {
      // TODO: Validate parameters

      const result = await ${name}(${untypedParameters({ parameters })})

      // TODO: Validate result

      return result
    }
  `
}

export default apiEndpoint
