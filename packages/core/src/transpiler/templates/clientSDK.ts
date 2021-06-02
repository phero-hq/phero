import {
  ClientEnvironment,
  JSType,
  RPCFunction,
  SamenManifest,
} from "../../domain"
import functionSignature from "./shared/functionSignature"
import { untypedParameters } from "./shared/parameters"
import { promise, type } from "./shared/types"
import {
  generateDateConverter,
  generateRefDateConverters,
} from "./shared/dateConverter"

interface Props {
  manifest: SamenManifest
  apiUrl: string
  environment: ClientEnvironment
}

const clientSDK = ({ apiUrl, manifest, environment }: Props): string => `
    ${setAuthorizationHeaderFunction()}

    ${requestFunction({ apiUrl, environment })}

    ${Object.values(manifest.models)
      .map((model) => wrapWithNamespace(model.namespace, model.ts))
      .join("\n")}

    ${generateRefDateConverters(manifest)}

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
  environment,
}: {
  apiUrl: string
  environment: ClientEnvironment
}) => `
  const _fetch = ${
    environment === ClientEnvironment.Node ? `require('node-fetch')` : `fetch`
  }
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
  const isEmptyResult = returnType.type === JSType.untyped

  const dateConvertLogic = generateDateConverter(
    manifest,
    returnType,
    "rpcResult",
  )

  return wrapWithNamespace(
    namespace,
    `
    export async function ${signature} {
      ${
        isEmptyResult
          ? `await requestVoid("${requestPath}", ${body})`
          : `const rpcResult = await request<${type(
              returnType,
              manifest,
            )}>("${requestPath}", ${body});
            ${dateConvertLogic ?? ""}
            return rpcResult;`
      }
    }
    `,
  )
}

export default clientSDK
