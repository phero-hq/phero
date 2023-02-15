import { ParseResult } from "../../domain/Parser"

export default function NumberParser(data: unknown): ParseResult<number> {
  return typeof data === "number" && !isNaN(data)
    ? { ok: true, result: data }
    : { ok: false, errors: [{ message: "Not a number" }] }
}
