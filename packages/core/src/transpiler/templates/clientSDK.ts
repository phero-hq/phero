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
import arrowFunctionSignature from "./shared/arrowFunctionSignature"

interface Props {
  manifest: SamenManifest
  environment: ClientEnvironment
}

const clientSDK = ({ manifest, environment }: Props) => `
  const _fetch = ${
    environment === ClientEnvironment.Node ? `require('node-fetch')` : `fetch`
  }

  export class SamenClient {
    private url: string

    public constructor(apiUrl: string) {
      this.url = apiUrl
    }

    ${authHeaderFunctions()}

    ${requestFunctions()}

    ${Object.entries(groupByNamespace(manifest.rpcFunctions))
      .map(([namespace, rpcs]) => {
        if (namespace === "none") {
          return rpcs.map((rpc) => rpcFunction(rpc, manifest, false)).join("\n")
        } else {
          return `
          public '${namespace}' = {
            ${rpcs.map((rpc) => rpcFunction(rpc, manifest, true)).join(",")}
          }
        `
        }
      })
      .join("\n")}
  }

  ${Object.values(manifest.models)
    .map((model) => wrapWithNamespace(model.namespace, model.ts))
    .join("\n")}

  ${generateRefDateConverters(manifest)}
`

function groupByNamespace(
  rpcFunctions: RPCFunction[],
): { [namespace: string]: RPCFunction[] } {
  const result: { [namespace: string]: RPCFunction[] } = {}

  for (const rpcFunction of rpcFunctions) {
    const namespace =
      rpcFunction.namespace.length > 0
        ? rpcFunction.namespace.join(".")
        : "none"
    if (!result[namespace]) result[namespace] = []
    result[namespace].push(rpcFunction)
  }

  return result
}

const authHeaderFunctions = () => `
  private authorizationHeader: string | undefined = undefined

  public setAuthorizationHeader(header: string) {
    this.authorizationHeader = header
  }

  public unsetAuthorizationHeader() {
    this.authorizationHeader = undefined
  }

  private getAuthorizationHeader(): { Authorization: string } | {} {
    return this.authorizationHeader
      ? { Authorization: this.authorizationHeader }
      : {}
  }
`

const requestFunctions = () => `
  private async request<T>(name: string, body: object): Promise<T> {
    try {
      const result = await _fetch(this.url + name, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthorizationHeader(),
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

  private async requestVoid(name: string, body: object): Promise<void> {
    try {
      const result = await _fetch(this.url + name, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthorizationHeader(),
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

const rpcFunction = (
  rpcFn: RPCFunction,
  manifest: SamenManifest,
  isInNamespace: boolean,
): string => {
  const { name, parameters: _parameters, returnType, namespace } = rpcFn
  // filter out idToken parameter
  const parameters = _parameters.filter((p) => p.name !== "idToken")
  const signature = isInNamespace
    ? arrowFunctionSignature({
        parameters,
        returnType: promise(returnType, manifest),
        manifest,
      })
    : functionSignature({
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

  return `
    ${
      isInNamespace
        ? `${name}: async ${signature} => {`
        : `public async ${signature} {`
    }
      ${
        isEmptyResult
          ? `await this.requestVoid("${requestPath}", ${body})`
          : `const rpcResult = await this.request<${type(
              returnType,
              manifest,
            )}>("${requestPath}", ${body});
            ${dateConvertLogic ?? ""}
            return rpcResult;`
      }
    }
  `
}

export default clientSDK
