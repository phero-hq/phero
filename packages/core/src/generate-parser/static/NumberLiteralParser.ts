import { Parser, ParseResult } from "../Parser"

export default function NumberLiteralParser<T extends number>(
  values: number[],
): Parser<T> {
  return (data: unknown): ParseResult<T> => {
    return typeof data === "number" && values.includes(data)
      ? { ok: true, result: data as T }
      : {
          ok: false,
          errors: [{ message: `Not one of (${values.join(" | ")})` }],
        }
  }
}
