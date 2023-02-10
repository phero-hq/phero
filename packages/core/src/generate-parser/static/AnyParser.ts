import { ParseResult } from "../Parser"

export default function AnyParser(data: unknown): ParseResult<any> {
  return { ok: true, result: data }
}
