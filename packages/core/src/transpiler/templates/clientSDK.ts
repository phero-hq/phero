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

    ${Object.values(manifest.models)
      .map((model) => wrapWithNamespace(model.namespace, model.ts))
      .join("\n")}

    ${manifest.rpcFunctions.map((rpc) => rpcFunction(rpc, manifest)).join("\n")}
  `

const setAuthorizationHeaderFunction = () => `
  let authorizationHeader: string | undefined = undefined
  export function setAuthorizationHeader(header: string) {
    authorizationHeader = header;
  }
  export function unsetAuthorizationHeader() {
    authorizationHeader = undefined
  }
  function getAuthorizationHeader(): { 'Authorization': string } | {} {
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

  async function request<T>(name: string, body: object): Promise<T> {
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
      const data = await result.json()
      return data as T
    } catch (err) {
      console.error(err)
      throw new Error("Network error")
    }
  }

  async function requestVoid(name: string, body: object): Promise<void> {
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
    } catch (err) {
      console.error(err)
      throw new Error("Network error")
    }
  }
`

function wrapWithNamespace(namespace: string[], tsCode: string) {
  if (namespace.length) {
    return `
          export namespace ${namespace.join(".")} {
            ${tsCode}
          }
        `
  }
  return tsCode
}

const rpcFunction = (rpcFn: RPCFunction, manifest: SamenManifest): string => {
  const { name, parameters: _parameters, returnType, namespace } = rpcFn
  // filter out idToken parameter
  const parameters = _parameters.filter((p) => p.name !== "idToken")
  const signature = functionSignature({
    name,
    parameters,
    returnType: promise(returnType, manifest),
    manifest,
  })
  const body = `{${untypedParameters({ parameters, manifest })}}`

  const requestPath = `/${
    namespace.length ? `${namespace.join("/")}/${name}` : name
  }`
  const requestFunction =
    returnType.type === JSType.untyped ? "requestVoid" : "request"

  return wrapWithNamespace(
    namespace,
    `
    export async function ${signature} {
      return ${requestFunction}("${requestPath}", ${body});
    }
    `,
  )
}

export default clientSDK
