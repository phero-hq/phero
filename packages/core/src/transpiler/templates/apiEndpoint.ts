import {
  JSType,
  JSValue,
  Ref,
  RefMap,
  RPCFunction,
  SamenManifest,
} from "../../domain"
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

    export function validate(${parameters
      .map((p) => `${p.name}: unknown`)
      .join(", ")}): boolean {
      ${generateRefValidators(p.manifest.refs)}

      return ${p.rpcFunction.parameters
        .map((p) => generateValidator(p.value, p.name))
        .join(" && \n")};
    }

    export async function ${signature} {
      if (!validate(${untypedParameters({ parameters })})) {
        throw new Error('not valid');
      }

      const result = await ${name}(${untypedParameters({ parameters })})

      // TODO: Validate result

      return result
    }
  `
}

export default apiEndpoint

function generateRefValidators(refs: RefMap): string {
  return [
    "const refs: { [refId: string]: (jsValue: unknown) => boolean } = {};",
    ...Object.entries(refs).map(([refId, { value }]) => {
      return `refs[\`${refId}\`] = (jsValue: unknown): boolean => (${generateValidator(
        value,
        "jsValue",
      )});`
    }),
  ].join("\n")
}

function generateValidator(value: JSValue, scope: string): string {
  switch (value.type) {
    case JSType.string:
      return value.oneOf
        ? `[${value.oneOf
            .map((v) => `\`${v}\``)
            .join(", ")}].includes(${scope})`
        : `typeof ${scope} === 'string'`

    case JSType.number:
      return value.oneOf
        ? `[${value.oneOf}].includes(${scope})`
        : `typeof ${scope} === 'number'`

    case JSType.boolean:
      return value.oneOf
        ? `[${value.oneOf}].includes(${scope})`
        : `typeof ${scope} === 'boolean'`

    case JSType.date:
      return `(${scope} instanceof Date || (
        typeof ${scope} === 'string' && 
        /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i.test(${scope}) && 
        !isNaN(Date.parse(${scope}))))`

    case JSType.null:
      return `${scope} === null`

    case JSType.undefined:
      return `${scope} === undefined`

    case JSType.untyped:
      return "true"

    case JSType.object:
      return [
        `${scope} !== null`,
        `typeof ${scope} === 'object'`,
        ...value.properties.map((p) =>
          generateValidator(p, `${scope}[\`${p.name}\`]`),
        ),
      ].join(" &&\n")

    case JSType.array:
      return [
        `Array.isArray(${scope})`,
        `${scope}.every((e, i) => ${generateValidator(
          value.elementType,
          `e`,
        )})`,
      ].join(" &&\n")

    case JSType.oneOfTypes:
      return `[${value.oneOfTypes
        .map((t) => generateValidator(t, scope))
        .join(" ||\n ")}]`

    case JSType.tuple:
      return [
        `Array.isArray(${scope})`,
        `${scope}.length === ${value.elementTypes.length}`,
        value.elementTypes
          .map((t, i) => generateValidator(t, `${scope}[${i}]`))
          .join(" &&\n "),
      ].join(" &&\n ")

    case JSType.ref:
      return `refs[\`${value.id}\`](${scope})`
  }
}
