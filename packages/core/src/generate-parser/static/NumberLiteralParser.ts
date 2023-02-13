import { Parser, ParseResult } from "../Parser"

export default function NumberLiteralParser<T extends number>(
  literal: number,
): Parser<T> {
  return (data: unknown): ParseResult<T> => {
    return typeof data === "number" && literal === data
      ? { ok: true, result: data as T }
      : {
          ok: false,
          errors: [{ message: `Must be ${literal}` }],
        }
  }
}
