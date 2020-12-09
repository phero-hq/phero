import { JSType, RPCFunction, SamenManifest } from "../../domain"
import functionSignature from "./shared/functionSignature"
import { untypedParameters } from "./shared/parameters"
import { promise } from "./shared/types"

interface Props {
  manifest: SamenManifest
  apiUrl: string
}

const clientSDK = ({ apiUrl, manifest }: Props): string => `
    ${requestFunction({ apiUrl })}

    ${Object.keys(manifest.models)
      .map((modelId) => manifest.models[modelId].ts)
      .join("\n")}

    ${manifest.rpcFunctions.map(rpcFunction).join("\n")}
  `

const requestFunction = ({ apiUrl }: { apiUrl: string }) => `
  const ENDPOINT = "${apiUrl}"

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

const rpcFunction = (rpcFn: RPCFunction): string => {
  const { name, parameters, returnType } = rpcFn
  const signature = functionSignature({
    name,
    parameters,
    returnType: promise(returnType),
  })
  const body = `{${untypedParameters({ parameters })}}`
  const isVoid = returnType.type === JSType.untyped ? "true" : "false"

  return `
    export async function ${signature} {
      return request("${name}", ${body}, ${isVoid});
    }
  `
}

export default clientSDK
