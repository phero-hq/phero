import { ParseResult } from "../Parser"

export default function StringParser(data: unknown): ParseResult<string> {
  return typeof data === "string"
    ? { ok: true, result: data }
    : { ok: false, errors: [{ message: "Not a string" }] }
}
