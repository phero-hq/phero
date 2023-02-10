import { Parser, ParseResult } from "../Parser"

export default function EnumParser<T>(
  ...values: (number | string)[]
): Parser<T> {
  return (data: unknown): ParseResult<T> => {
    return (typeof data === "string" || typeof data === "number") &&
      values.includes(data)
      ? {
          ok: true,
          result: data as T,
        }
      : {
          ok: false,
          errors: [{ message: `Not one of (${values.join(" | ")})` }],
        }
  }
}
