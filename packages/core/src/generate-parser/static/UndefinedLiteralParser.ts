import { ParseResult } from "../Parser"

export default function UndefinedLiteralParser(
  data: unknown,
): ParseResult<undefined> {
  return data === undefined
    ? { ok: true, result: data }
    : {
        ok: false,
        errors: [{ message: `Not undefined` }],
      }
}
