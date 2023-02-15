import { ParseResult } from "../Parser"

export default function NumberKeyParser(data: unknown): ParseResult<number> {
  if (typeof data === "string") {
    const key = parseInt(data, 10)
    if (!isNaN(key)) {
      return { ok: true, result: key }
    }
  }

  return { ok: false, errors: [{ message: "Not a number" }] }
}
