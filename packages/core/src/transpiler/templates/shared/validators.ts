import {
  JSType,
  JSValue,
  RefMap,
  RPCFunction,
  SamenManifest,
} from "../../../domain"

export default function generateInputValidator(
  rpcFunction: RPCFunction,
  manifest: SamenManifest,
): string {
  const { parameters } = rpcFunction

  return `
    export interface ValidationError {
      scope: string;
      jsValue: any;
      message: string;
    }

    class InvalidInputError extends Error {
      errorCode = 'INVALID_INPUT_ERROR'
      constructor(private readonly errors: ValidationError[]) {
        super('Invalid input for RPC')
      }
    }

    export function validate(${parameters
      .map((p) => `${p.name}: any`)
      .join(", ")}): ValidationError[] {

      function validateTypeOf(typeString: 'string' | 'number' | 'boolean', scope: string, jsValue: any): ValidationError[] {
        return typeof jsValue === typeString
          ? []
          : [{ scope, jsValue, message: \`value is not a \${typeString}\` }];
      }

      function validateValueOf(possibleValues: any[], scope: string, jsValue: any): ValidationError[] {
        return possibleValues.includes(jsValue)
          ? []
          : [{ scope, jsValue, message: \`value must be one of: \${possibleValues.map(v => \`"\${v}"\`).join(', ')}\` }];
      }

      function validateDate(scope: string, jsValue: any): ValidationError[] {
        const isValidDate = typeof jsValue === 'string' && !isNaN(Date.parse(jsValue)) && new Date(jsValue).toJSON() === jsValue;
        return isValidDate
          ? []
          : [{ scope, jsValue, message: 'value must be a date' }];
      }

      function validateNull(scope: string, jsValue: any): ValidationError[] {
        return jsValue === null
          ? []
          : [{ scope, jsValue, message: 'value must be null' }];
      }

      function validateUndefined(scope: string, jsValue: any): ValidationError[] {
        return jsValue === undefined
          ? []
          : [{ scope, jsValue, message: 'value must be undefined' }];
      }

      function validateObject(scope: string, jsValue: any): ValidationError[] {
        return jsValue !== null && typeof jsValue === 'object'
          ? []
          : [{ scope, jsValue, message: 'value must be an object' }];
      }

      function validateArray(scope: string, jsValue: any): ValidationError[] {
        return Array.isArray(jsValue)
          ? []
          : [{ scope, jsValue, message: 'value must be an array' }];
      }

      function validateTuple(length: number, scope: string, jsValue: any): ValidationError[] {
        return Array.isArray(jsValue) && jsValue.length === length
          ? []
          : [{ scope, jsValue, message: \`value must be a tuple of length \${length}\` }];
      }

      function validateOneOfTypes(scope: string, jsValue: any, typeValidators: Array<() => ValidationError[]>): ValidationError[] {
        for (const typeValidator of typeValidators) {
          try {
            if (typeValidator().length === 0) {
              return [];
            }
          } catch (e) { /* ignore possible error */ }
        }
        const numberOfTypes = typeValidators.length;
        return [{ scope, jsValue, message: \`value is neither of the \${numberOfTypes} union types\` }];
      }

      function flatten<T>(arr: T[][]): T[] {
        return arr.reduce((r, a) => [...r, ...a], [])
      }

      ${generateRefValidators(manifest.refs)}

      return [${rpcFunction.parameters
        .map((p) => `...${generateValidator(p.value, p.name)},`)
        .join("\n")}];
    }
  `
}

function generateRefValidators(refs: RefMap): string {
  return [
    "const refs: { [refId: string]: (jsValue: any) => ValidationError[] } = {};",
    ...Object.entries(refs).map(([refId, { value }]) => {
      return `refs[\`${refId}\`] = (jsValue: any): ValidationError[] => (${generateValidator(
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
        ${scope}.flatMap((el: any, i: number) => ${generateValidator(
        value.elementType,
        `${scope}[i]`,
      )}),
      ])`

    case JSType.oneOfTypes:
      return `validateOneOfTypes('${scope}', ${scope}, [
        ${value.oneOfTypes
          .map((t) => `() => ${generateValidator(t, scope)},`)
          .join("\n")}
        ])`

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
