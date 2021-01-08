import {
  JSType,
  JSValue,
  RefMap,
  RPCFunction,
  SamenConfig,
  SamenManifest,
} from "../../domain"
import functionSignature from "./shared/functionSignature"
import { parametersFromObject, untypedParameters } from "./shared/parameters"
import { promise } from "./shared/types"

export interface Props {
  rpcFunction: RPCFunction
  manifest: SamenManifest
  relativeSamenFilePath: string
  config: SamenConfig
}

const apiEndpoint = (p: Props) => {
  const models = p.rpcFunction.modelIds
    .map((id) => p.manifest.models[id].ts)
    .join("\n")

  return `
    import { ${p.rpcFunction.name} } from '${p.relativeSamenFilePath}';

    ${models}

    ${validator(p)}

    ${awsHandler(p)}
    
    ${gcHandler(p)}

    ${rpcFunction(p)}
  `
}

const validator = (p: Props): string => {
  const { parameters } = p.rpcFunction

  return `
    export interface ValidationError {
      scope: string;
      jsValue: unknown;
      message: string;
    }

    class InvalidInputError extends Error {
      errorCode = 'INVALID_INPUT_ERROR'
      constructor(private readonly errors: ValidationError[]) {
        super('Invalid input for RPC')
      }
    }

    export function validate(${parameters
      .map((p) => `${p.name}: unknown`)
      .join(", ")}): ValidationError[] {

      function validateTypeOf(typeString: 'string' | 'number' | 'boolean', scope: string, jsValue: unknown): ValidationError[] {
        return typeof jsValue === typeString
          ? []
          : [{ scope, jsValue, message: \`value is not a \${typeString}\` }];
      }

      function validateValueOf(possibleValues: any[], scope: string, jsValue: any): ValidationError[] {
        return possibleValues.includes(jsValue)
          ? []
          : [{ scope, jsValue, message: \`value must be one of: \${possibleValues.map(v => \`"\${v}"\`).join(', ')}\` }];
      }

      function validateDate(scope: string, jsValue: unknown): ValidationError[] {
        const r = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;
        const isValidDate = jsValue instanceof Date || (
          typeof jsValue === 'string' && r.test(jsValue) && !isNaN(Date.parse(jsValue))
        );
        return isValidDate
          ? []
          : [{ scope, jsValue, message: 'value must be a date' }];
      }

      function validateNull(scope: string, jsValue: unknown): ValidationError[] {
        return jsValue === null
          ? []
          : [{ scope, jsValue, message: 'value must be null' }];
      }

      function validateUndefined(scope: string, jsValue: unknown): ValidationError[] {
        return jsValue === undefined
          ? []
          : [{ scope, jsValue, message: 'value must be undefined' }];
      }

      function validateObject(scope: string, jsValue: unknown): ValidationError[] {
        return jsValue !== null && typeof jsValue === 'object'
          ? []
          : [{ scope, jsValue, message: 'value must be an object' }];
      }

      function validateArray(scope: string, jsValue: unknown): ValidationError[] {
        return Array.isArray(jsValue)
          ? []
          : [{ scope, jsValue, message: 'value must be an array' }];
      }

      function validateTuple(length: number, scope: string, jsValue: unknown): ValidationError[] {
        return Array.isArray(jsValue) && jsValue.length === length
          ? []
          : [{ scope, jsValue, message: \`value must be a tuple of length \${length}\` }];
      }

      function validateOneOfTypes(numberOfTypes: number, scope: string, jsValue: unknown, isValid: boolean): ValidationError[] {
        return isValid
          ? []
          : [{ scope, jsValue, message: \`value is neither of the \${numberOfTypes} union types\` }];
      }

      function flatten<T>(arr: T[][]): T[] {
        return arr.reduce((r, a) => [...r, ...a], [])
      }

      ${generateRefValidators(p.manifest.refs)}

      return [${p.rpcFunction.parameters
        .map((p) => `...${generateValidator(p.value, p.name)},`)
        .join("\n")}];
    }
  `
}

const awsHandler = (p: Props): string => {
  const { name, parameters, returnType } = p.rpcFunction
  const parametersFromBody = parametersFromObject({
    parameters,
    objectName: "body",
  })

  return `
    export async function awsHandler(event: any) {
      const body = JSON.parse(event.body === null || event.body === undefined ? '{}' : event.body)

      const inputValidationResult = validate(${parametersFromBody})

      if (inputValidationResult.length) {
        return {
          statusCode: 400,
          body: JSON.stringify(new InvalidInputError(inputValidationResult), null, 4),
          headers: {
            "Content-Type": "application/json",
          },
        }
      }

      try {
        const result = await ${name}(${parametersFromBody})

        return {
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
      } catch (e) {
        return {
          statusCode: 500,
          body: JSON.stringify(e, null, 4),
          headers: {
            "Content-Type": "application/json",
          },
        }
      }
    }
  `
}

const gcHandler = (p: Props): string => {
  const {
    rpcFunction: { name, parameters, returnType },
    config: { cors },
  } = p
  const parametersFromBody = parametersFromObject({
    parameters,
    objectName: "body",
  })
  const hasIdTokenParam = parameters.some((p) => p.name === "idToken")

  return `
    const ORIGIN_WHITELIST = ${cors ? JSON.stringify(cors.whitelist) : `[]`}
    let firebaseAdminInitialized = false;
    export async function gcHandler(req: any, res: any) {
      if (!ORIGIN_WHITELIST.includes(req.headers.origin)) {
        res.status(401).end()
        return
      }

      res.set({
        "Access-Control-Allow-Origin": req.headers.origin,
        "Access-Control-Allow-Methods": req.method,
        "Access-Control-Allow-Headers": "content-type, authorization",
      })

      if (req.method === 'OPTIONS') {
        res.end();
        return
      } else if (req.method !== 'POST') {
        res.status(404).end()
        return
      }

      const body = req.body

      ${
        hasIdTokenParam
          ? `
        /// AUTH
        const firebaseAdmin = require('firebase-admin')
        if (!firebaseAdminInitialized) {
          firebaseAdmin.initializeApp()
          firebaseAdminInitialized = true
        }
        const idTokenString = req.headers['authorization']?.substring('Bearer '.length)
        if (!idTokenString) {
          res.status(401).end();
          return;
        }
        const idToken = await firebaseAdmin.auth().verifyIdToken(idTokenString)
        body.idToken = idToken;
        /// AUTH
      `
          : ""
      }
      
      const inputValidationResult = validate(${parametersFromBody})

      if (inputValidationResult.length) {
        res.status(400).json(new InvalidInputError(inputValidationResult))
        return
      }

      try {
        const result = await ${name}(${parametersFromBody})
        res.json(${returnType.type === JSType.untyped ? "null" : "result"})
        return
      } catch (e) {
        res.status(500).json(e)
        return
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
      const inputValidationResult = validate(${untypedParameters({
        parameters,
      })})

      if (inputValidationResult.length) {
        throw new InvalidInputError(inputValidationResult);
      }

      const result = await ${name}(${untypedParameters({ parameters })})
      return result
    }
  `
}

export default apiEndpoint

function generateRefValidators(refs: RefMap): string {
  return [
    "const refs: { [refId: string]: (jsValue: unknown) => ValidationError[] } = {};",
    ...Object.entries(refs).map(([refId, { value }]) => {
      return `refs[\`${refId}\`] = (jsValue: unknown): ValidationError[] => (${generateValidator(
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
        ? `validateValueOf([${value.oneOf
            .map((v) => `\`${v}\``)
            .join(", ")}], '${scope}', ${scope})`
        : `validateTypeOf('string', '${scope}', ${scope})`

    case JSType.number:
      return value.oneOf
        ? `validateValueOf([${value.oneOf}], '${scope}', ${scope})`
        : `validateTypeOf('number', '${scope}', ${scope})`

    case JSType.boolean:
      return value.oneOf
        ? `validateValueOf([${value.oneOf}], '${scope}', ${scope})`
        : `validateTypeOf('boolean', '${scope}', ${scope})`

    case JSType.date:
      return `validateDate('${scope}', ${scope})`

    case JSType.null:
      return `validateNull('${scope}', ${scope})`

    case JSType.undefined:
      return `validateUndefined('${scope}', ${scope})`

    case JSType.untyped:
      return "[]"

    case JSType.object:
      return `flatten([
        validateObject('${scope}', ${scope}),
        ${value.properties
          .map((p) => `${generateValidator(p, `${scope}[\`${p.name}\`]`)},`)
          .join("\n")}
      ])`

    case JSType.array:
      return `flatten([
        validateArray('${scope}', ${scope}),
        ${scope}.flatMap((el, i) => ${generateValidator(
        value.elementType,
        `${scope}[i]`,
      )}),
      ])`

    case JSType.oneOfTypes:
      return `validateOneOfTypes(${
        value.oneOfTypes.length
      }, '${scope}', ${scope}, [
        ${value.oneOfTypes
          .map((t) => `${generateValidator(t, scope)}.length,`)
          .join("\n")}
        ].some(s => s === 0))`

    case JSType.tuple:
      return `flatten([
        validateTuple(${value.elementTypes.length}, '${scope}', ${scope}),
        ${value.elementTypes
          .map((t, i) => `${generateValidator(t, `${scope}[${i}]`)},`)
          .join("\n")}
      ])`

    case JSType.ref:
      return `refs[\`${value.id}\`](${scope})`
  }
}
