import { JSType, JSValue, RPCFunction, SamenManifest } from "../../../domain"

export function generateInputDateConverter(
  rpcFunction: RPCFunction,
  manifest: SamenManifest,
): string {
  const { parameters } = rpcFunction

  return `
    export function convertDates(${parameters
      .map((p) => `${p.name}: any`)
      .join(", ")}): void {
      
      ${rpcFunction.parameters.map((param) =>
        generateDateConverter(manifest, param.value, param.name),
      )}
    }
  `
}

export function generateRefDateConverters(manifest: SamenManifest): string {
  return [
    "const refDateConverters: { [refId: string]: (jsValue: any) => void } = {};",
    ...Object.entries(manifest.refs).map(([refId, { value }]) => {
      const refConverter = generateDateConverter(manifest, value, "jsValue")
      if (refConverter === null) {
        return ""
      }
      return `refDateConverters[\`${refId}\`] = (jsValue: any): void => {
        ${refConverter}
      };`
    }),
  ].join("\n")
}

export function generateDateConverter(
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
      return `refDateConverters[\`${value.id}\`]?.(${scope})`
  }
}
