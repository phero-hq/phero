import { JSType, RPCFunction, SamenManifest } from "../../domain"
import functionSignature from "./shared/functionSignature"
import { untypedParameters } from "./shared/parameters"
import { promise } from "./shared/types"

interface Props {
  manifest: SamenManifest
  apiUrl: string
  isEnvNode: boolean
}

const clientSDK = ({ apiUrl, manifest, isEnvNode }: Props): string => `
    ${setAuthorizationHeaderFunction()}

    ${requestFunction({ apiUrl, isEnvNode })}

    ${Object.keys(manifest.models)
      .map((modelId) => manifest.models[modelId].ts)
      .join("\n")}

    ${manifest.rpcFunctions.map(rpcFunction).join("\n")}
  `

const setAuthorizationHeaderFunction = () => `
  let authorizationHeader: string | undefined = undefined
  export function setAuthorizationHeader(header: string) {
    authorizationHeader = header;
  }
  export function unsetAuthorizationHeader() {
    authorizationHeader = undefined
  }
  function getAuthorizationHeader() {
    return authorizationHeader ? { 'Authorization': authorizationHeader } : {}
  }
`

const requestFunction = ({
  apiUrl,
  isEnvNode,
}: {
  apiUrl: string
  isEnvNode: boolean
}) => `
  const _fetch = ${isEnvNode ? `require('node-fetch')` : `fetch`}
  const ENDPOINT = "${apiUrl}"

  async function request<T>(
    name: string,
    body: object,
    isVoid: boolean,
  ): Promise<T> {
    try {
      const result = await _fetch(ENDPOINT + name, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthorizationHeader(),
        },
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
