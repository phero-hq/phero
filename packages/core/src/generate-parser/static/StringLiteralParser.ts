import { Parser, ParseResult } from "../Parser"

export default function StringLiteralParser<T extends string>(
  values: string[],
): Parser<T> {
  return (data: unknown): ParseResult<T> => {
    return typeof data === "string" && values.includes(data)
      ? { ok: true, result: data as T }
      : {
          ok: false,
          errors: [{ message: `Not one of (${values.join(" | ")})` }],
        }
  }
}
