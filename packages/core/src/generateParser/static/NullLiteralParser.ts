import { type ParseResult } from "../../domain/Parser"

export default function NullLiteralParser(data: unknown): ParseResult<null> {
  return data === null
    ? { ok: true, result: data }
    : {
        ok: false,
        errors: [{ message: `Not null` }],
      }
}
