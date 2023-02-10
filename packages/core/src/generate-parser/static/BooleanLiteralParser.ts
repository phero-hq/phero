import { ParseResult } from "../Parser"

export function TrueLiteralParser(data: unknown): ParseResult<true> {
  return data === true
    ? { ok: true, result: data }
    : {
        ok: false,
        errors: [{ message: `Not true` }],
      }
}

export function FalseLiteralParser(data: unknown): ParseResult<false> {
  return data === false
    ? { ok: true, result: data }
    : {
        ok: false,
        errors: [{ message: `Not false` }],
      }
}
