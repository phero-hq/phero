import { ParseResult } from "../../domain/Parser"

export default function AnyParser(data: unknown): ParseResult<any> {
  return { ok: true, result: data }
}
