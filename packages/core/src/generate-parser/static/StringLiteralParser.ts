import { Parser, ParseResult } from "../Parser"

export default function StringLiteralParser<T extends string>(
  literal: string,
): Parser<T> {
  return (data: unknown): ParseResult<T> => {
    return typeof data === "string" && literal === data
      ? { ok: true, result: data as T }
      : {
          ok: false,
          errors: [{ message: `Must be ${literal}` }],
        }
  }
}
