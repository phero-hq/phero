import {
  JSType,
  JSValue,
  RefMap,
  RPCFunction,
  SamenManifest,
} from "../../domain"
import functionSignature from "./shared/functionSignature"
import { untypedParameters } from "./shared/parameters"
import { promise, type } from "./shared/types"

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

    ${dateConverters(manifest)}

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

function dateConverters(manifest: SamenManifest): string {
  return [
    "const refs: { [refId: string]: (jsValue: any) => void } = {};",
    ...Object.entries(manifest.refs).map(([refId, { value }]) => {
      const refConverter = generateDateConverter(manifest, value, "jsValue")
      if (refConverter === null) {
        return ""
      }
      return `refs[\`${refId}\`] = (jsValue: any): void => {
        ${refConverter}
      };`
    }),
  ].join("\n")
}

function generateDateConverter(
  manifest: SamenManifest,
  value: JSValue,
  scope: string,
): string | null {
  switch (value.type) {
    case JSType.string:
    case JSType.number:
    case JSType.boolean:
    case JSType.null:
    case JSType.undefined:
    case JSType.untyped:
      return null

    case JSType.date:
      // we need the if specifically for the oneOfTypes case
      return `if (typeof ${scope} === "string") { ${scope} = new Date(${scope}); }`

    case JSType.object:
      const propDateConverters = value.properties
        .map((prop) =>
          generateDateConverter(manifest, prop, `${scope}[\`${prop.name}\`]`),
        )
        .filter((result) => result !== null)

      if (propDateConverters.length === 0) {
        return null
      }
      return propDateConverters.join("\n")

    case JSType.array:
      const elementConverter = generateDateConverter(
        manifest,
        value.elementType,
        `${scope}[i]`,
      )
      if (elementConverter === null) {
        return null
      }
      return `${scope}.forEach((el: any, i: number) => {
        ${elementConverter}
      });`

    case JSType.oneOfTypes:
      const oneOfTypesConverters = value.oneOfTypes
        .map((t) => generateDateConverter(manifest, t, scope))
        .filter((result) => result !== null)

      if (oneOfTypesConverters.length === 0) {
        return null
      }

      return oneOfTypesConverters.join("\n")

    case JSType.tuple:
      const elementConverters = value.elementTypes
        .map((elementType, i) =>
          generateDateConverter(manifest, elementType, `${scope}[${i}]`),
        )
        .filter((result) => result !== null)

      if (elementConverters.length === 0) {
        return null
      }

      return elementConverters.join("\n")

    case JSType.ref:
      const refConverter = generateDateConverter(
        manifest,
        manifest.refs[value.id].value,
        scope,
      )
      if (refConverter === null) {
        return null
      }
      return `refs[\`${value.id}\`]?.(${scope})`
  }
}
