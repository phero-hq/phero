import prettier from "prettier"
import { JSType, JSValue } from "../domain/JSValue"
import { RPCFunctionParameter } from "../domain/manifest"

export function formatCode(s: string) {
  return prettier.format(s, { parser: "typescript" })
}

export function generateType(value: JSValue): string {
  switch (value.type) {
    case JSType.number:
    case JSType.string:
    case JSType.boolean:
    case JSType.null:
    case JSType.undefined:
      return value.type

    case JSType.ref:
      return value.id

    case JSType.array:
      return `${value.elementType.type}[]`

    case JSType.tuple:
      return `[${value.elementTypes.map(generateType).join(", ")}]`

    case JSType.date:
      return "Date"

    case JSType.oneOfTypes:
      return `${value.oneOfTypes.map(generateType).join(" | ")}`

    case JSType.object:
      return `{${value.properties
        .map((p) => `${p.name}: ${generateType(p)}`)
        .join(";")}}`

    case JSType.untyped:
      return "void"
  }
}

export function generateParameters(parameters: RPCFunctionParameter[]): string {
  return parameters.map((p) => `${p.name}: ${generateType(p.value)}`).join(", ")
}
