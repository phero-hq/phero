import { JSType, RPCFunction, SamenManifest } from "../../domain"
import {
  parametersFromObject,
  typedParameters,
  untypedParameters,
} from "./shared/parameters"
import { promise } from "./shared/types"

interface Props {
  rpcFunction: RPCFunction
  manifest: SamenManifest
  relativeSamenFilePath: string
}

const apiEndpoint = ({
  rpcFunction,
  manifest,
  relativeSamenFilePath,
}: Props) => {
  const { name, parameters, returnType } = rpcFunction

  const models = rpcFunction.modelIds
    .map((id) => manifest.models[id].ts)
    .join("\n")

  const bodyParameters = parametersFromObject({
    parameters,
    objectName: "body",
  })

  const rpcSignature =
    `rpc_${name}(` +
    typedParameters({ parameters }) +
    `): ${promise(returnType)}`

  return `
    import { ${name} } from '${relativeSamenFilePath}';

    ${models}

    export async function handler(event: any) {
      const body = JSON.parse(event.body)
      const result = await ${name}(${bodyParameters})
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

    export async function ${rpcSignature} {
      // TODO: Validate parameters

      const result = await ${name}(${untypedParameters({ parameters })})

      // TODO: Validate result

      return result
    }
  `
}

export default apiEndpoint
