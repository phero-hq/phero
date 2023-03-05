import { type Parser, type ParseResult } from "../../domain/Parser"

export default function TemplateLiteralParser<T extends string>(
  pattern: RegExp,
): Parser<T> {
  return (data: unknown): ParseResult<T> => {
    if (typeof data === "string" && pattern.test(data)) {
      return { ok: true, result: data as T }
    }

    return {
      ok: false,
      errors: [{ message: "String is not in the correct format" }],
    }
  }
}
